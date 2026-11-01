// Lets the client poll a deposit's status after returning from OxaPay's
// hosted invoice page (the callback webhook may not have landed yet).

import { authenticateRequest } from "@/lib/supabase/authenticateRequest";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const userId = await authenticateRequest(request);
  if (!userId) {
    return Response.json({ ok: false, message: "Sesi login tidak valid." });
  }

  const depositId = new URL(request.url).searchParams.get("depositId");
  if (!depositId) {
    return Response.json({ ok: false, message: "depositId wajib diisi." });
  }

  const supabase = getSupabaseServerClient();
  const { data: deposit, error } = await supabase
    .from("deposits")
    .select("status, amount")
    .eq("id", depositId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !deposit) {
    return Response.json({ ok: false, message: "Deposit tidak ditemukan." });
  }

  if (deposit.status !== "success") {
    return Response.json({ ok: true, status: deposit.status, amount: deposit.amount });
  }

  const { data: profile } = await supabase.from("profiles").select("balance").eq("id", userId).maybeSingle();
  return Response.json({ ok: true, status: deposit.status, amount: deposit.amount, balance: profile?.balance ?? null });
}
