// Seed data for the admin mock backend. Centralizes every demo record the
// admin stores (src/lib/admin/*Store.ts) materialize into localStorage on
// first read — mirrors how src/lib/dashboard/data.ts seeds the user side.
// Swap for real API responses once a backend exists; call sites don't change.

import type { Service, User } from "@/lib/dashboard/types";
import type { AdminActivityLogEntry, Promotion, Supplier } from "./types";

export const seedUsers: User[] = [
  { id: "usr_8231", name: "Jane Doe", username: "janedoe", email: "jane@example.com", joinedAt: "2026-03-14", balance: 11.71, referralCode: "JANE2026", role: "user", status: "active" },
  { id: "usr_admin01", name: "Bluffy Admin", username: "admin", email: "admin@bluffy.app", joinedAt: "2026-01-05", balance: 0, referralCode: "ADMIN2026", role: "admin", status: "active" },
];

// No placeholder services ship by default anymore — the catalogue is meant
// to come from a real supplier import (Admin > Supplier > Lihat Katalog).
export const seedServices: Service[] = [];

// Orders, transactions and deposits are no longer seeded here — all three
// now live in Supabase (see supabase/orders_schema.sql and
// payments_schema.sql), starting empty, same as the services/price_tiers
// catalog.

// Only VAK-SMS ships by default — it's the one real, connected supplier
// (see Admin > Supplier > Lihat Katalog). No other seed suppliers get
// generated, so there's nothing demo to clean up here later.
export const seedSuppliers: Supplier[] = [
  { id: "sup_05", name: "VAK-SMS", apiUrl: "https://vak-sms.com", apiKey: "", active: true, connectionStatus: "disconnected", serviceCount: 0, updatedAt: "2026-10-31T00:00:00Z" },
];

// Promotions (coupon/deposit-bonus codes) have no real wiring yet — no
// promo actually discounts a purchase — so nothing ships by default.
// Referral usages and support tickets are no longer seeded here either —
// both now live in Supabase (see referrals_schema.sql and
// tickets_schema.sql).
export const seedPromotions: Promotion[] = [];

export const seedActivityLog: AdminActivityLogEntry[] = [
  { id: "act_01", actorId: "usr_admin01", actorName: "Bluffy Admin", action: "Menyetujui deposit DEP-50012 untuk Jane Doe", targetType: "deposit", targetId: "DEP-50012", at: "2026-10-30T10:11:00Z" },
  { id: "act_03", actorId: "usr_admin01", actorName: "Bluffy Admin", action: "Mengubah harga jual WhatsApp — Indonesia", targetType: "pricing", targetId: "whatsapp:ID", at: "2026-10-28T09:40:00Z" },
];
