"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/dashboard/ToastProvider";
import { completeAuthSession, getActiveAuthSession } from "@/lib/auth";
import { getUserById } from "@/lib/admin/usersStore";
import type { User } from "@/lib/dashboard/types";
import { adminNav } from "@/lib/admin/nav";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { AdminMobileDrawer } from "./AdminMobileDrawer";
import { AdminUnauthorizedView } from "./AdminUnauthorizedView";

type AuthState = "checking" | "authorized" | "unauthorized";

function pageTitle(pathname: string): string {
  const match = [...adminNav].reverse().find((item) => (item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href)));
  return match?.label ?? "Dashboard";
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // getSession() trusts a local demo-session flag that's never cleared on
  // logout and falls back to a default non-admin user when absent — fine
  // for telling apart "admin" vs "regular user" cosmetically, but it never
  // actually confirms a real Supabase session is still alive. Checking the
  // real session here (and resyncing the local flag from it) means a
  // logged-out visitor — or anyone whose Supabase session has expired —
  // correctly lands on "unauthorized" instead of a stale admin view.
  const checkAuth = useCallback(async () => {
    const result = await getActiveAuthSession();
    if (!result?.ok || result.session.role !== "admin") {
      setAuthState("unauthorized");
      return;
    }
    completeAuthSession(result.session);
    const user = await getUserById(result.session.userId);
    if (user) {
      setAdminUser(user);
      setAuthState("authorized");
    } else {
      setAuthState("unauthorized");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time check of the real Supabase session on mount, not a render-triggered sync
    checkAuth();

    // See the matching comment in UserProvider.tsx — a back/forward-cache
    // restore can repaint a stale authorized view without rerunning this
    // effect, so re-validate the real session when that happens.
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) checkAuth();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [checkAuth]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- closing the drawer on route change, not a render-triggered sync
    setDrawerOpen(false);
  }, [pathname]);

  if (authState === "checking") {
    return <div className="min-h-screen bg-gradient-to-b from-soft/60 via-[#EEF3FE] to-canvas" />;
  }

  if (authState === "unauthorized") {
    return <AdminUnauthorizedView />;
  }

  return (
    <ToastProvider>
      <div className="relative min-h-screen bg-gradient-to-b from-soft/60 via-[#EEF3FE] to-canvas">
        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
          <AdminSidebar />
          <div className="min-w-0 flex-1">
            <AdminTopbar title={pageTitle(pathname)} adminUser={adminUser} onOpenMenu={() => setDrawerOpen(true)} />
            <main className="mt-6 pb-10">{children}</main>
          </div>
        </div>
        <AdminMobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>
    </ToastProvider>
  );
}
