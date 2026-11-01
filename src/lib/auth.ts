// Real auth, backed by Supabase (see supabase/schema.sql for the profiles
// table + trigger this relies on, and .env.local for the project URL/key).
// Only identity lives here — balance, orders, etc. stay in the local demo
// stores under src/lib/admin/*; completeAuthSession() bridges a Supabase
// session into those stores right after login/register so the rest of the
// dashboard keeps working unchanged, just keyed by the real user id.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase/client";
import { setSession } from "./admin/session";

export type Role = "user" | "admin";
export type AuthSession = { userId: string; name: string; email: string; role: Role; referralCode: string };

export type LoginResult = { ok: true; session: AuthSession } | { ok: false; message: string };
export type RegisterResult = { ok: true; session: AuthSession | null } | { ok: false; message: string };
export type OAuthResult = { ok: true } | { ok: false; message: string };

function mapError(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Incorrect email or password.";
  if (/already registered|already exists|user already/i.test(message)) return "An account with this email already exists.";
  if (/password should be at least/i.test(message)) return message;
  return message;
}

function connectSupabase(): { ok: true; client: SupabaseClient } | { ok: false; message: string } {
  try {
    return { ok: true, client: getSupabaseClient() };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Supabase isn't configured yet." };
  }
}

// Shared by password login and the Google OAuth callback — a Supabase auth
// user on its own has no role/display-name; both live in the profiles row
// the signup trigger creates (see supabase/schema.sql).
async function resolveSession(supabase: SupabaseClient, userId: string, fallbackEmail: string | null | undefined): Promise<LoginResult> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("name, role, referral_code, status")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return { ok: false, message: "Signed in, but your profile couldn't be loaded. Please try again." };
  }

  if (profile.status === "blocked") {
    await supabase.auth.signOut();
    return { ok: false, message: "Your account has been blocked. Please contact support." };
  }

  return {
    ok: true,
    session: {
      userId,
      name: profile.name as string,
      email: fallbackEmail ?? "",
      role: profile.role === "admin" ? "admin" : "user",
      referralCode: profile.referral_code as string,
    },
  };
}

export async function login(input: { email: string; password: string }): Promise<LoginResult> {
  const conn = connectSupabase();
  if (!conn.ok) return conn;

  const { data, error } = await conn.client.auth.signInWithPassword({ email: input.email, password: input.password });
  if (error || !data.user) {
    return { ok: false, message: mapError(error?.message ?? "Incorrect email or password.") };
  }

  return resolveSession(conn.client, data.user.id, data.user.email ?? input.email);
}

// signInWithOAuth() redirects the whole page to Google, so this only ever
// returns when something fails before that redirect happens (e.g. the
// Google provider isn't enabled in Supabase yet). On success the browser
// navigates away and /auth/callback picks the session up afterward.
export async function loginWithGoogle(): Promise<OAuthResult> {
  const conn = connectSupabase();
  if (!conn.ok) return conn;

  const { error } = await conn.client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

// Called by /auth/callback once Supabase has finished the OAuth redirect
// and stored a session client-side. Returns null if there's no session to
// resolve (e.g. the page was opened directly, or the OAuth exchange hasn't
// landed yet).
export async function getActiveAuthSession(): Promise<LoginResult | null> {
  const conn = connectSupabase();
  if (!conn.ok) return conn;

  const { data } = await conn.client.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;

  return resolveSession(conn.client, user.id, user.email);
}

export async function register(input: { name: string; email: string; password: string; referralCode?: string }): Promise<RegisterResult> {
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Supabase isn't configured yet." };
  }

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { name: input.name, referral_code: input.referralCode?.trim() || undefined } },
  });

  if (error) return { ok: false, message: mapError(error.message) };
  if (!data.user) return { ok: false, message: "Something went wrong creating your account. Please try again." };

  // data.session is only set when the project has email confirmation
  // turned off — otherwise the account exists but can't sign in yet. The
  // signup trigger (handle_new_user, see supabase/referrals_schema.sql) has
  // already run as part of the auth.users insert, so the profiles row
  // (including its generated referral_code and any referral bonus) exists
  // by the time this resolves.
  if (!data.session) return { ok: true, session: null };

  return resolveSession(supabase, data.user.id, input.email);
}

// Sets the active admin-section session flag from a resolved Supabase
// session so /dashboard and /admin's session-gated reads work right away.
export function completeAuthSession(session: AuthSession): void {
  setSession({ userId: session.userId, role: session.role, name: session.name });
}
