// Polls VAK-SMS for the SMS code received on a rented number. Orders from
// before the VAK-SMS integration (dummy phone numbers, no supplier_order_id)
// fall back to a generic message instead of calling the API with a null id.
// User-facing messages here never name the supplier or forward its raw
// error text — those go to console.error for admins instead.

import { authenticateRequest } from "@/lib/supabase/authenticateRequest";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { candidateBases, extractSmsCode, extractVakSmsError, vaksmsGet } from "@/lib/admin/vaksmsClient";

export async function POST(request: Request) {
  const userId = await authenticateRequest(request);
  if (!userId) {
    return Response.json({ ok: false, message: "Sesi login tidak valid — silakan masuk ulang." });
  }

  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  if (!orderId) {
    return Response.json({ ok: false, message: "Permintaan tidak valid." });
  }

  const admin = getSupabaseServerClient();
  const { data: order } = await admin.from("orders").select("user_id, supplier_order_id, otp").eq("id", orderId).maybeSingle();
  if (!order || order.user_id !== userId) {
    return Response.json({ ok: false, message: "Pesanan tidak ditemukan." });
  }
  if (!order.supplier_order_id) {
    return Response.json({ ok: false, message: "Nomor ini belum siap menerima SMS. Coba lagi sebentar lagi." });
  }
  if (order.otp) {
    return Response.json({ ok: true, otp: order.otp });
  }

  const apiKey = process.env.VAKSMS_API_KEY;
  const apiUrl = process.env.VAKSMS_API_URL ?? "https://vak-sms.com";
  if (!apiKey) {
    console.error("sms: VAKSMS_API_KEY is not configured");
    return Response.json({ ok: false, message: "Layanan cek SMS sedang tidak tersedia. Coba lagi nanti." });
  }

  for (const base of candidateBases(apiUrl)) {
    const path = `/api/getSmsCode?apiKey=${encodeURIComponent(apiKey)}&idNum=${encodeURIComponent(order.supplier_order_id)}`;
    const data = await vaksmsGet(base, path);
    if (data === null) continue;

    const code = extractSmsCode(data);
    if (code) {
      await admin.from("orders").update({ otp: code }).eq("id", orderId);
      return Response.json({ ok: true, otp: code });
    }

    const errorMessage = extractVakSmsError(data);
    if (errorMessage) console.error("sms: getSmsCode failed:", errorMessage);
    return Response.json({ ok: false, message: "Belum ada SMS masuk — coba lagi sebentar lagi." });
  }

  return Response.json({ ok: false, message: "Tidak dapat memeriksa SMS saat ini. Coba lagi sebentar lagi." });
}
