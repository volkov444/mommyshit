"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/dashboard/ToastProvider";
import { getSession } from "@/lib/admin/session";
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

  useEffect(() => {
    const session = getSession();
    if (session.role !== "admin") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of an external store (localStorage demo session) on mount, not a render-triggered sync
      setAuthState("unauthorized");
      return;
    }
    getUserById(session.userId).then((user) => {
      if (user) {
        setAdminUser(user);
        setAuthState("authorized");
      } else {
        setAuthState("unauthorized");
      }
    });
  }, []);

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
