// Rents a real number from VAK-SMS and, only once that succeeds, debits the
// buyer's balance and writes the order atomically via the purchase_number
// RPC (so a charge can never happen without a real number, or vice versa).
// Price/supplierPrice are re-derived from the matching price_tiers row here
// — never trusted from the client — so a tampered request can't buy a
// number below its real configured price.

import { extractBearerToken } from "@/lib/supabase/authenticateRequest";
import { getSupabaseServerClient, getSupabaseUserClient } from "@/lib/supabase/server";
import { candidateBases, extractActivationId, extractBalance, extractPhoneNumber, extractVakSmsError, vaksmsGet } from "@/lib/admin/vaksmsClient";

async function getVakSmsBalance(apiUrl: string, apiKey: string): Promise<number | null> {
  for (const base of candidateBases(apiUrl)) {
    const data = await vaksmsGet(base, `/api/getBalance?apiKey=${encodeURIComponent(apiKey)}`);
    const balance = extractBalance(data);
    if (balance !== null) return balance;
  }
  return null;
}

export async function POST(request: Request) {
  const token = extractBearerToken(request);
  if (!token) {
    return Response.json({ ok: false, message: "Sesi login tidak valid — silakan masuk ulang." });
  }

  const admin = getSupabaseServerClient();
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) {
    return Response.json({ ok: false, message: "Sesi login tidak valid — silakan masuk ulang." });
  }

  const body = await request.json().catch(() => null);
  const serviceId = typeof body?.serviceId === "string" ? body.serviceId : "";
  const countryCode = typeof body?.countryCode === "string" ? body.countryCode : "";
  const price = typeof body?.price === "number" ? body.price : NaN;
  if (!serviceId || !countryCode || !Number.isFinite(price)) {
    return Response.json({ ok: false, message: "Permintaan tidak valid." });
  }

  const apiKey = process.env.VAKSMS_API_KEY;
  const apiUrl = process.env.VAKSMS_API_URL ?? "https://vak-sms.com";
  if (!apiKey) {
    console.error("purchase_number: VAKSMS_API_KEY is not configured");
    return Response.json({ ok: false, message: "Layanan beli nomor sedang tidak tersedia. Coba lagi nanti." });
  }

  const [{ data: service }, { data: country }, { data: tierRows }] = await Promise.all([
    admin.from("services").select("id, name").eq("id", serviceId).maybeSingle(),
    admin.from("countries").select("code, name, flag").eq("code", countryCode).maybeSingle(),
    // Catalog imports can leave more than one price_tiers row for the same
    // service+country rounding to the same sell_price (the supplier's cost
    // drifted slightly between import runs, so the importer inserted a new
    // row instead of updating the existing one) — order by stock so the
    // best-stocked duplicate wins instead of erroring on an ambiguous match.
    admin
      .from("price_tiers")
      .select("supplier_price, sell_price, supplier_service_code")
      .eq("service_id", serviceId)
      .eq("country_code", countryCode)
      .eq("active", true)
      .gt("stock", 0)
      .gte("sell_price", price - 0.0001)
      .lte("sell_price", price + 0.0001)
      .order("stock", { ascending: false })
      .limit(1),
  ]);
  const tier = tierRows?.[0];

  if (!service || !country || !tier) {
    return Response.json({ ok: false, message: "Harga sudah berubah — silakan pilih ulang layanan/negara." });
  }
  if (!tier.supplier_service_code) {
    console.error(`purchase_number: ${serviceId}/${countryCode} has no supplier_service_code — catalog needs re-import`);
    return Response.json({ ok: false, message: "Nomor untuk layanan/negara ini sedang tidak tersedia. Coba lagi nanti." });
  }

  const balanceBefore = await getVakSmsBalance(apiUrl, apiKey);

  let phoneNumber: string | null = null;
  let activationId: string | null = null;
  for (const base of candidateBases(apiUrl)) {
    const path = `/api/getNumber?apiKey=${encodeURIComponent(apiKey)}&service=${encodeURIComponent(tier.supplier_service_code)}&country=${encodeURIComponent(countryCode)}`;
    const data = await vaksmsGet(base, path);
    if (data === null) continue;
    const errorMessage = extractVakSmsError(data);
    if (errorMessage) {
      console.error("purchase_number: getNumber failed:", errorMessage);
      return Response.json({ ok: false, message: "Nomor tidak tersedia saat ini. Coba lagi sebentar lagi." });
    }
    phoneNumber = extractPhoneNumber(data);
    activationId = extractActivationId(data);
    break;
  }

  if (!phoneNumber || !activationId) {
    return Response.json({ ok: false, message: "Nomor tidak tersedia saat ini. Coba lagi sebentar lagi." });
  }

  // Best-effort cost-drift check: compare VAK-SMS's real balance drop against
  // our cached supplier_price (a catalog-import snapshot, not live pricing).
  // Not exact if another purchase hits the same shared supplier account at
  // the same moment, but it catches a stale catalog price — where the real
  // supplier cost has risen since the last import — before it quietly
  // erodes margin on every sale of that tier.
  const balanceAfter = await getVakSmsBalance(apiUrl, apiKey);
  if (balanceBefore !== null && balanceAfter !== null) {
    const actualCost = balanceBefore - balanceAfter;
    if (actualCost > tier.supplier_price * 1.15 + 0.005) {
      console.error(
        `purchase_number: supplier cost drift for ${serviceId}/${countryCode} — cached supplier_price=${tier.supplier_price}, actual balance drop=${actualCost.toFixed(4)}. Catalog is likely stale, re-import pricing.`,
      );
    }
  }

  const orderId = `ORD-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const userClient = getSupabaseUserClient(token);
  const { data: newBalance, error: rpcError } = await userClient.rpc("purchase_number", {
    p_order_id: orderId,
    p_service_id: service.id,
    p_service_name: service.name,
    p_country_code: country.code,
    p_country_name: country.name,
    p_country_flag: country.flag,
    p_phone_number: phoneNumber,
    p_price: tier.sell_price,
    p_supplier_price: tier.supplier_price,
    p_supplier_order_id: activationId,
  });

  if (rpcError) {
    // We already spent real supplier balance renting this number — release
    // it back since the purchase itself didn't go through (e.g. the user's
    // balance changed between page load and submit).
    for (const base of candidateBases(apiUrl)) {
      const released = await vaksmsGet(base, `/api/setStatus?apiKey=${encodeURIComponent(apiKey)}&idNum=${encodeURIComponent(activationId)}&status=end`);
      if (released !== null) break;
    }
    const message = /insufficient/i.test(rpcError.message) ? "Saldo tidak mencukupi." : "Gagal menyelesaikan pembelian. Coba lagi sebentar lagi.";
    return Response.json({ ok: false, message });
  }

  const createdAt = new Date().toISOString();
  return Response.json({
    ok: true,
    newBalance,
    order: {
      id: orderId,
      userId: userData.user.id,
      serviceId: service.id,
      serviceName: service.name,
      countryCode: country.code,
      countryName: country.name,
      countryFlag: country.flag,
      phoneNumber,
      price: tier.sell_price,
      // Never send Bluffy's cost price to the buyer's own browser — see
      // ordersStore.ts's USER_COLUMNS for why getOrdersForUser omits it too.
      supplierPrice: 0,
      otp: null,
      status: "active",
      createdAt,
      statusHistory: [{ status: "active", at: createdAt }],
    },
  });
}
