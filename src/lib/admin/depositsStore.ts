// Deposit history, backed by Supabase (see supabase/payments_schema.sql).
// Deposit rows are created only by the OxaPay create-invoice API route
// (src/app/api/payments/oxapay/create) — nothing here creates one.
// Resolving a deposit (success/failed) goes through the credit_deposit /
// fail_deposit RPCs, the same ones the OxaPay callback webhook calls, so a
// manually-approved deposit and an auto-credited crypto deposit behave
// identically (idempotent, balance + transaction written atomically).

import { getSupabaseClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLogStore";
import type { Deposit } from "./types";

type DepositRow = { id: string; user_id: string; amount: number; method: string; status: Deposit["status"]; created_at: string };

function fromRow(row: DepositRow): Deposit {
  return { id: row.id, userId: row.user_id, amount: row.amount, methodId: row.method, status: row.status, createdAt: row.created_at };
}

export async function getDeposits(): Promise<Deposit[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("deposits")
    .select("id, user_id, amount, method, status, created_at")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(fromRow);
}

export async function getDepositById(id: string): Promise<Deposit | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("deposits")
    .select("id, user_id, amount, method, status, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return undefined;
  return fromRow(data);
}

export async function approveDeposit(id: string, actorId: string): Promise<Deposit | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("credit_deposit", { p_deposit_id: id });
  const result = Array.isArray(data) ? data[0] : data;
  if (error || !result?.ok) return undefined;

  const updated = await getDepositById(id);
  if (!updated) return undefined;

  logActivity({ actorId, actorName: "Bluffy Admin", action: `Menyetujui deposit ${id}`, targetType: "deposit", targetId: id });
  return updated;
}

export async function rejectDeposit(id: string, actorId: string): Promise<Deposit | undefined> {
  const supabase = getSupabaseClient();
  const { data: ok, error } = await supabase.rpc("fail_deposit", { p_deposit_id: id });
  if (error || !ok) return undefined;

  const updated = await getDepositById(id);
  if (!updated) return undefined;

  logActivity({ actorId, actorName: "Bluffy Admin", action: `Menolak deposit ${id}`, targetType: "deposit", targetId: id });
  return updated;
}
