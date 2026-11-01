// Dashboard data service layer. Orders, balance, deposits and transactions
// are real (Supabase-backed — see supabase/orders_schema.sql,
// vaksms_numbers.sql and payments_schema.sql); the rest
// (countries/services/pricing) is seeded catalog data. purchaseNumber,
// refreshSms and cancelOrder all go through server routes backed by a real
// VAK-SMS integration (src/app/api/numbers/*) — the server rents/polls/
// releases the number and the client never sees the supplier API key.

import { paymentMethods } from "./data";
import { getSession } from "@/lib/admin/session";
import { getActiveServices } from "@/lib/admin/servicesStore";
import { getPriceTiersFor } from "@/lib/admin/pricingStore";
import { getCountries as getCountriesStore } from "@/lib/admin/countriesStore";
import { getUserById, updateUserName } from "@/lib/admin/usersStore";
import { getTransactionsForUser } from "@/lib/admin/transactionsStore";
import { getOrdersForUser } from "@/lib/admin/ordersStore";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { CountryWithTiers, Order, PriceTier, User } from "./types";

export type ActionResult = { ok: true } | { ok: false; message: string };
export type CancelResult = { ok: true; newBalance?: number } | { ok: false; message: string };
export type SmsResult = { ok: true; otp: string } | { ok: false; message: string };
export type PurchaseResult = { ok: true; order: Order; newBalance: number } | { ok: false; message: string };
export type TopUpResult = { ok: true; invoiceUrl: string } | { ok: false; message: string };

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const NOT_CONNECTED_PAYMENT =
  "Payment gateway isn't connected yet — this is a preview environment, no real charge was made.";

async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// Best-effort: releases+refunds any of the caller's own orders that have
// sat 'active' past the reservation window with no SMS ever received (see
// src/app/api/numbers/sweep-expired). Run before every read of the user's
// own orders below so an order abandoned by closing the Buy Number tab
// (the only place with a live countdown timer) still gets refunded the
// next time the user looks at their orders/overview from anywhere.
async function sweepExpiredOrders(): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;
  try {
    await fetch("/api/numbers/sweep-expired", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  } catch {
    // Non-fatal — the Buy Number page's own live timer already covers the
    // common case, this is just the catch-up path for everywhere else.
  }
}

export async function getCurrentUser(): Promise<User> {
  await delay(300);
  await sweepExpiredOrders();
  const session = getSession();
  const user = await getUserById(session.userId);
  if (!user) throw new Error("No current user found for the active session.");
  return user;
}

export async function getOverviewStats() {
  await delay(500);
  await sweepExpiredOrders();
  const session = getSession();
  const allOrders = await getOrdersForUser(session.userId);
  const totalOrders = allOrders.length;
  const activeNumbers = allOrders.filter((o) => o.status === "active").length;
  const completedOrders = allOrders.filter((o) => o.status === "completed").length;
  const totalSpending = allOrders
    .filter((o) => o.status === "completed" || o.status === "active")
    .reduce((sum, o) => sum + o.price, 0);
  return { totalOrders, activeNumbers, completedOrders, totalSpending };
}

export async function getRecentTransactions(limit = 5) {
  await delay(450);
  const session = getSession();
  const transactions = await getTransactionsForUser(session.userId);
  return transactions.slice(0, limit);
}

export async function getOrders() {
  await delay(500);
  await sweepExpiredOrders();
  const session = getSession();
  return getOrdersForUser(session.userId);
}

export async function getActiveOrders() {
  await delay(400);
  await sweepExpiredOrders();
  const session = getSession();
  const orders = await getOrdersForUser(session.userId);
  return orders.filter((o) => o.status === "active");
}

export async function getCountries() {
  await delay(250);
  return getCountriesStore();
}

export async function getServices() {
  await delay(250);
  return getActiveServices();
}

export async function quotePriceTiers(countryCode: string, serviceId: string): Promise<PriceTier[]> {
  const tiers = await getPriceTiersFor(serviceId, countryCode);
  return tiers.map((t) => ({ price: t.sellPrice, stock: t.stock }));
}

// Which countries a service can issue numbers for is derived straight from
// the price tiers an admin has set up for it (see Negara & Harga) — not a
// static allowlist — so an imported service/country shows up here the
// moment it has stock, with no extra wiring.
export async function getCountriesForService(serviceId: string): Promise<CountryWithTiers[]> {
  await delay(350);
  const countries = await getCountriesStore();
  const withTiers = await Promise.all(
    countries.map(async (c) => {
      const tiers = await quotePriceTiers(c.code, serviceId);
      const totalStock = tiers.reduce((sum, t) => sum + t.stock, 0);
      const cheapestPrice = tiers.length > 0 ? Math.min(...tiers.map((t) => t.price)) : 0;
      return { ...c, tiers, totalStock, cheapestPrice };
    }),
  );
  return withTiers.filter((c) => c.tiers.length > 0);
}

export async function getPaymentMethods() {
  await delay(200);
  return paymentMethods;
}

export async function topUp(amount: number, methodId: string): Promise<TopUpResult> {
  if (methodId !== "oxapay") {
    await delay(900);
    return { ok: false, message: NOT_CONNECTED_PAYMENT };
  }

  const token = await getAccessToken();
  if (!token) {
    return { ok: false, message: "Sesi login tidak valid — silakan masuk ulang." };
  }

  try {
    const res = await fetch("/api/payments/oxapay/create", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount }),
    });
    const result = await res.json();
    if (!result.ok) return { ok: false, message: result.message ?? "Gagal membuat invoice." };
    return { ok: true, invoiceUrl: result.invoiceUrl };
  } catch {
    return { ok: false, message: "Tidak dapat menghubungi server. Coba lagi sebentar lagi." };
  }
}

// Rents a real number from VAK-SMS via the server (src/app/api/numbers/
// purchase) — the server re-derives the authoritative price/supplier code
// from price_tiers and debits the balance atomically with the order insert
// via the purchase_number RPC, so an order can never exist without its
// balance having actually been charged, and never the other way around.
export async function purchaseNumber(countryCode: string, serviceId: string, price: number): Promise<PurchaseResult> {
  const token = await getAccessToken();
  if (!token) {
    return { ok: false, message: "Sesi login tidak valid — silakan masuk ulang." };
  }

  try {
    const res = await fetch("/api/numbers/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ serviceId, countryCode, price }),
    });
    const result = await res.json();
    if (!result.ok) return { ok: false, message: result.message ?? "Gagal membeli nomor." };
    return { ok: true, order: result.order, newBalance: result.newBalance };
  } catch {
    return { ok: false, message: "Tidak dapat menghubungi server. Coba lagi sebentar lagi." };
  }
}

export async function refreshSms(orderId: string): Promise<SmsResult> {
  const token = await getAccessToken();
  if (!token) {
    return { ok: false, message: "Sesi login tidak valid — silakan masuk ulang." };
  }

  try {
    const res = await fetch("/api/numbers/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId }),
    });
    const result = await res.json();
    if (!result.ok) return { ok: false, message: result.message ?? "Belum ada SMS masuk." };
    return { ok: true, otp: result.otp };
  } catch {
    return { ok: false, message: "Tidak dapat menghubungi server. Coba lagi sebentar lagi." };
  }
}

export async function cancelOrder(orderId: string): Promise<CancelResult> {
  const token = await getAccessToken();
  if (!token) {
    return { ok: false, message: "Sesi login tidak valid — silakan masuk ulang." };
  }

  try {
    const res = await fetch("/api/numbers/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId }),
    });
    const result = await res.json();
    if (!result.ok) return { ok: false, message: result.message ?? "Gagal membatalkan pesanan." };
    return { ok: true, newBalance: result.newBalance };
  } catch {
    return { ok: false, message: "Tidak dapat menghubungi server. Coba lagi sebentar lagi." };
  }
}

// Name is the only column a user can write directly (see the column-scoped
// grant in payments_schema.sql — role/balance stay RPC-only), so that's the
// only field persisted to Supabase here; username/email aren't real columns
// on profiles and only ever update the local demo record.
export async function updateProfile(patch: Partial<Pick<User, "name" | "username" | "email">>): Promise<ActionResult> {
  const session = getSession();
  if (patch.name !== undefined) {
    const ok = await updateUserName(session.userId, patch.name);
    if (!ok) return { ok: false, message: "Gagal menyimpan nama." };
  }
  return { ok: true };
}

// Re-authenticates with the current password first (Supabase's updateUser
// has no built-in "verify old password" step) so a changePassword call can
// never succeed without actually proving the caller knows the current one.
export async function changePassword(current: string, next: string): Promise<ActionResult> {
  const supabase = getSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;
  if (!email) return { ok: false, message: "Sesi login tidak valid — silakan masuk ulang." };

  const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password: current });
  if (reauthError) return { ok: false, message: "Password saat ini salah." };

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { ok: false, message: error.message };

  return { ok: true };
}

export type { Order, PriceTier, CountryWithTiers };
