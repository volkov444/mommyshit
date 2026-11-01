// OxaPay invoice callback. Must read the raw body (not request.json())
// before parsing, since signature verification needs the exact bytes
// OxaPay signed — re-serializing first would risk a byte mismatch.

import crypto from "node:crypto";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const signatureBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

const CREDIT_STATUSES = new Set(["Paid"]);
const FAIL_STATUSES = new Set(["Expired", "Failed"]);

export async function POST(request: Request) {
  const secret = process.env.OXAPAY_MERCHANT_API_KEY;
  if (!secret) {
    return new Response("Not configured", { status: 500 });
  }

  const signature = request.headers.get("hmac");
  const rawBody = await request.text();
  if (!signature || !verifySignature(rawBody, signature, secret)) {
    return new Response("Invalid signature", { status: 400 });
  }

  const payload = JSON.parse(rawBody) as { order_id?: string; status?: string; type?: string };
  const depositId = payload.order_id;
  const status = payload.status;
  if (!depositId || !status) {
    return new Response("OK", { status: 200 });
  }

  const supabase = getSupabaseServerClient();

  if (CREDIT_STATUSES.has(status)) {
    const { error } = await supabase.rpc("credit_deposit", { p_deposit_id: depositId });
    if (error) console.error("OxaPay webhook: credit_deposit failed", depositId, error);
  } else if (FAIL_STATUSES.has(status)) {
    const { error } = await supabase.rpc("fail_deposit", { p_deposit_id: depositId });
    if (error) console.error("OxaPay webhook: fail_deposit failed", depositId, error);
  } else {
    console.info("OxaPay webhook: no-op status", depositId, status);
  }

  return new Response("OK", { status: 200 });
}
