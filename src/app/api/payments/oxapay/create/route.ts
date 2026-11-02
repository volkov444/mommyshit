// Creates an OxaPay hosted invoice for a crypto top-up and records a
// pending deposit row in Supabase (service-role — this is the first thing
// that ever creates a deposit; nothing else in the app does). The callback
// webhook (../webhook/route.ts) is what later marks it success/failed.

import { authenticateRequest } from "@/lib/supabase/authenticateRequest";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const API_BASE = "https://api.oxapay.com/v1";

function siteOrigin(request: Request): string {
  // NEXT_PUBLIC_SITE_URL may be present but set to an empty string (e.g. a
  // blank value copied from .env.local into Vercel's env vars) — `||` so an
  // empty string still falls back, unlike `??` which only catches null/undefined.
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
}

export async function POST(request: Request) {
  const userId = await authenticateRequest(request);
  if (!userId) {
    return Response.json({ ok: false, message: "Sesi login tidak valid — silakan masuk ulang." });
  }

  const apiKey = process.env.OXAPAY_MERCHANT_API_KEY;
  if (!apiKey) {
    return Response.json({ ok: false, message: "OxaPay belum dikonfigurasi di server." });
  }

  const body = await request.json().catch(() => null);
  const amount = typeof body?.amount === "number" ? body.amount : NaN;
  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json({ ok: false, message: "Nominal top up tidak valid." });
  }

  const depositId = `dep_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const origin = siteOrigin(request);

  let invoice: { track_id: string; payment_url: string };
  try {
    const res = await fetch(`${API_BASE}/payment/invoice`, {
      method: "POST",
      headers: { merchant_api_key: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        order_id: depositId,
        description: "Bluffy top up",
        callback_url: `${origin}/api/payments/oxapay/webhook`,
        return_url: `${origin}/dashboard/topup?deposit=${depositId}`,
        sandbox: process.env.OXAPAY_SANDBOX === "true",
        fee_paid_by_payer: 1,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.data?.track_id || !data?.data?.payment_url) {
      // OxaPay's top-level `message` is a generic catch-all ("There was an
      // issue with the submitted data..."); `error.message` is the specific,
      // actionable reason (e.g. amount below their minimum) — prefer it.
      const message =
        typeof data?.error?.message === "string"
          ? data.error.message
          : typeof data?.message === "string"
            ? data.message
            : "Gagal membuat invoice OxaPay.";
      return Response.json({ ok: false, message });
    }
    invoice = data.data;
  } catch {
    return Response.json({ ok: false, message: "Tidak dapat menghubungi OxaPay. Coba lagi sebentar lagi." });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("deposits").insert({
    id: depositId,
    user_id: userId,
    amount,
    currency: "usd",
    method: "oxapay",
    provider: "oxapay",
    provider_payment_id: invoice.track_id,
    status: "pending",
  });
  if (error) {
    return Response.json({ ok: false, message: "Gagal menyimpan data deposit." });
  }

  return Response.json({ ok: true, invoiceUrl: invoice.payment_url });
}
