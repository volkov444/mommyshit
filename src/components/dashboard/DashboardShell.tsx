"use client";

import { ToastProvider } from "./ToastProvider";
import { UserProvider } from "./UserProvider";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { Topbar } from "./Topbar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ToastProvider>
        <div className="relative min-h-screen bg-gradient-to-b from-soft/60 via-[#EEF3FE] to-canvas">
          <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
            <Sidebar />
            <div className="min-w-0 flex-1">
              <Topbar />
              <main className="mt-6 pb-28 md:pb-6">{children}</main>
            </div>
          </div>
          <MobileNav />
        </div>
      </ToastProvider>
    </UserProvider>
  );
}
