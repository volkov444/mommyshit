"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/dashboard/api";
import { completeAuthSession, getActiveAuthSession } from "@/lib/auth";
import type { User } from "@/lib/dashboard/types";

type UserContextValue = {
  user: User | null;
  updateUser: (patch: Partial<User>) => void;
};

const UserContext = createContext<UserContextValue | null>(null);

// getCurrentUser()/getSession() trust a local, never-expiring demo-session
// flag (src/lib/admin/session.ts) that falls back to a default guest user
// when absent — so on its own it can't tell "logged out" from "never
// visited before". This guard checks the REAL Supabase session first: no
// real session means straight to /login, a real session means the local
// flag gets resynced (completeAuthSession) before anything else loads, so
// a stale/missing local flag can't desync from the actual signed-in user.
export function UserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authorized, setAuthorized] = useState(false);

  const checkAuth = useCallback(async () => {
    const result = await getActiveAuthSession();
    if (!result?.ok) {
      router.replace("/login");
      return false;
    }
    completeAuthSession(result.session);
    return true;
  }, [router]);

  useEffect(() => {
    let active = true;

    checkAuth().then((ok) => {
      if (!active) return;
      if (!ok) return;
      setAuthorized(true);
      getCurrentUser().then((u) => {
        if (active) setUser(u);
      });
    });

    // Browsers can restore a page from the back/forward cache (e.g. after
    // pressing Back from /login) without re-running this effect at all —
    // the DOM is just repainted from an in-memory snapshot. Re-validate the
    // real session whenever that happens so a stale, already-logged-out
    // dashboard view can't be resurrected by the Back button.
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) checkAuth();
    }
    window.addEventListener("pageshow", onPageShow);

    return () => {
      active = false;
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [checkAuth]);

  function updateUser(patch: Partial<User>) {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  if (!authorized) {
    return <div className="min-h-screen bg-gradient-to-b from-soft/60 via-[#EEF3FE] to-canvas" />;
  }

  return <UserContext.Provider value={{ user, updateUser }}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
