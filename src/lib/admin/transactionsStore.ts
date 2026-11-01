// Transaction history, backed by Supabase (see supabase/payments_schema.sql)
// so every balance change is visible across every device the user logs in
// from. There is deliberately no addTransaction() here — every transaction
// is written atomically alongside its balance change, inside one of the
// debit_own_balance / admin_adjust_balance / credit_deposit RPCs (see
// usersStore.ts and depositsStore.ts), never as a standalone insert.

import { getSupabaseClient } from "@/lib/supabase/client";
import type { Transaction } from "@/lib/dashboard/types";

type TransactionRow = { id: string; user_id: string; type: Transaction["type"]; description: string; amount: number; status: Transaction["status"]; date: string };

function fromRow(row: TransactionRow): Transaction {
  return { id: row.id, userId: row.user_id, type: row.type, description: row.description, amount: row.amount, status: row.status, date: row.date };
}

export async function getTransactions(): Promise<Transaction[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("id, user_id, type, description, amount, status, date")
    .order("date", { ascending: false });
  if (error || !data) return [];
  return data.map(fromRow);
}

export async function getTransactionsForUser(userId: string): Promise<Transaction[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("id, user_id, type, description, amount, status, date")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error || !data) return [];
  return data.map(fromRow);
}
