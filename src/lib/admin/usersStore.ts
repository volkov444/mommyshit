import { getSupabaseClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLogStore";
import type { User } from "@/lib/dashboard/types";

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  role: User["role"];
  balance: number;
  status: User["status"];
  referral_code: string;
  created_at: string;
};

function fromRow(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    username: row.email.split("@")[0],
    email: row.email,
    joinedAt: row.created_at.slice(0, 10),
    balance: row.balance,
    referralCode: row.referral_code,
    role: row.role,
    status: row.status,
  };
}

const PROFILE_COLUMNS = "id, name, email, role, balance, status, referral_code, created_at";

export async function getUsers(): Promise<User[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS);
  if (error || !data) return [];
  return (data as ProfileRow[]).map(fromRow);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", id).maybeSingle();
  if (error || !data) return undefined;
  return fromRow(data as ProfileRow);
}

// Only the "name" column is grantable to a self-updating user (see
// payments_schema.sql's column-scoped grant) — role/balance/status are
// unwritable here by design, changed only via the RPCs below.
export async function updateUserName(id: string, name: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("profiles").update({ name }).eq("id", id);
  return !error;
}

export async function setUserStatus(id: string, status: User["status"], actorId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("admin_set_user_status", { p_user_id: id, p_status: status });
  if (error || !data) return false;

  const target = await getUserById(id);
  const actor = await getUserById(actorId);
  logActivity({
    actorId,
    actorName: actor?.name ?? "Admin",
    action: `${status === "blocked" ? "Memblokir" : "Mengaktifkan"} pengguna ${target?.name ?? id}`,
    targetType: "user",
    targetId: id,
  });
  return true;
}

export async function getBalance(id: string): Promise<number> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("profiles").select("balance").eq("id", id).maybeSingle();
  if (error || !data) return 0;
  return data.balance;
}

export async function getBalances(ids: string[]): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("profiles").select("id, balance").in("id", ids);
  if (error || !data) return new Map();
  return new Map(data.map((row) => [row.id, row.balance]));
}

export async function getTotalBalance(): Promise<number> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("profiles").select("balance");
  if (error || !data) return 0;
  return data.reduce((sum, row) => sum + row.balance, 0);
}

/**
 * Applies a balance delta via a security-definer RPC (which also records
 * the matching transaction atomically — see payments_schema.sql) and
 * returns the merged user record with its fresh balance. Self changes
 * (actorId === id, e.g. a purchase) go through debit_own_balance;
 * admin-initiated changes go through admin_adjust_balance, which also logs
 * to the local activity log.
 */
export async function adjustUserBalance(id: string, delta: number, reason: string, actorId: string): Promise<User | undefined> {
  const user = await getUserById(id);
  if (!user) return undefined;

  const supabase = getSupabaseClient();
  let newBalance: number | undefined;

  if (actorId === id) {
    const { data, error } = await supabase.rpc("debit_own_balance", { p_amount: -delta, p_description: reason });
    if (error) return undefined;
    newBalance = data as number;
  } else {
    const { data, error } = await supabase.rpc("admin_adjust_balance", { p_user_id: id, p_delta: delta, p_reason: reason });
    if (error) return undefined;
    newBalance = data as number;

    const actor = await getUserById(actorId);
    logActivity({
      actorId,
      actorName: actor?.name ?? "Admin",
      action: `${delta >= 0 ? "Menambah" : "Mengurangi"} saldo ${user.name} sebesar Rp${Math.abs(delta).toLocaleString("id-ID")}`,
      targetType: "user",
      targetId: id,
    });
  }

  return { ...user, balance: newBalance ?? user.balance };
}
