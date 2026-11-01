// Session flag read on the client, bridged in from a real Supabase login
// (see completeAuthSession() in src/lib/auth.ts). The Admin Dashboard gates
// itself on session.role; getSession() falls back to a default demo user
// for anyone who hasn't signed in at all, so /dashboard still has
// something to show.

import type { Session } from "./types";

const STORAGE_KEY = "bluffy_demo_session";
const DEFAULT_USER_ID = "usr_8231";

function readStore(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function writeStore(session: Session) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // storage unavailable (private browsing, quota, etc.) — demo data is best-effort
  }
}

export function getSession(): Session {
  const existing = readStore();
  if (existing) return existing;
  const fallback: Session = { userId: DEFAULT_USER_ID, role: "user", name: "Guest" };
  writeStore(fallback);
  return fallback;
}

export function setSession(session: Session): void {
  writeStore(session);
}
