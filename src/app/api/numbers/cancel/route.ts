// Cancels a rented number: best-effort releases it back to VAK-SMS, then
// marks the order cancelled via the cancel_own_order RPC. That RPC refunds
// the user only if no SMS code was ever received (see
// supabase/vaksms_cancel_refund.sql) — a used number isn't refundable, an
// unused one is. A short cooldown after purchase blocks instant
// cancel-and-retry spam against the supplier (mirrors how real SMS-number
// suppliers gate cancellation) — enforced here, not just in the UI, since
// the UI check alone can be bypassed by calling this route directly.

import { extractBearerToken } from "@/lib/supabase/authenticateRequest";
import { getSupabaseServerClient, getSupabaseUserClient } from "@/lib/supabase/server";
import { candidateBases, vaksmsGet } from "@/lib/admin/vaksmsClient";

export const CANCEL_COOLDOWN_MS = 2 * 60 * 1000;

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
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  if (!orderId) {
    return Response.json({ ok: false, message: "Permintaan tidak valid." });
  }

  const { data: order } = await admin.from("orders").select("user_id, supplier_order_id, created_at").eq("id", orderId).maybeSingle();
  if (!order || order.user_id !== userData.user.id) {
    return Response.json({ ok: false, message: "Pesanan tidak ditemukan." });
  }

  const elapsedMs = Date.now() - new Date(order.created_at).getTime();
  if (elapsedMs < CANCEL_COOLDOWN_MS) {
    const remainingSec = Math.ceil((CANCEL_COOLDOWN_MS - elapsedMs) / 1000);
    return Response.json({ ok: false, message: `Tunggu ${remainingSec} detik lagi sebelum membatalkan pesanan ini.` });
  }

  const apiKey = process.env.VAKSMS_API_KEY;
  const apiUrl = process.env.VAKSMS_API_URL ?? "https://vak-sms.com";
  if (order.supplier_order_id && apiKey) {
    for (const base of candidateBases(apiUrl)) {
      const released = await vaksmsGet(base, `/api/setStatus?apiKey=${encodeURIComponent(apiKey)}&idNum=${encodeURIComponent(order.supplier_order_id)}&status=end`);
      if (released !== null) break;
    }
  }

  const userClient = getSupabaseUserClient(token);
  const { data, error } = await userClient.rpc("cancel_own_order", { p_order_id: orderId });
  const result = Array.isArray(data) ? data[0] : data;
  if (error || !result?.ok) {
    return Response.json({ ok: false, message: "Pesanan tidak bisa dibatalkan." });
  }

  return Response.json({ ok: true, newBalance: result.new_balance ?? undefined });
}
