import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Service-role client — bypasses RLS entirely. Only ever import this from
// src/app/api/**/route.ts (server-only code); SUPABASE_SERVICE_ROLE_KEY has
// no NEXT_PUBLIC_ prefix so Next never bundles it into client code.
export function getSupabaseServerClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase service role belum dikonfigurasi — isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local, lalu restart dev server.");
  }

  client = createClient(url, serviceKey, { auth: { persistSession: false } });
  return client;
}

// A client that calls the database AS the given user (their own JWT on
// every request), not the service role — so auth.uid() resolves correctly
// inside security-definer RPCs like purchase_number/cancel_own_order that
// key off the caller's own identity. Never memoized (one per request/token).
export function getSupabaseUserClient(accessToken: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase belum dikonfigurasi — isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local, lalu restart dev server.");
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
