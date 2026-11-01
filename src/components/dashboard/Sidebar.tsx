"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HelpCircle, LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/cn";
import { dashboardNav } from "@/lib/dashboard/nav";
import { useToast } from "./ToastProvider";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  function handleLogout() {
    toast("Signed out. See you soon!", "success");
    router.push("/login");
  }

  return (
    <aside className="hidden shrink-0 md:flex md:w-20 lg:w-64 xl:w-72">
      <div className="sticky top-6 flex h-[calc(100vh-3rem)] w-full flex-col rounded-3xl bg-white p-3 shadow-soft ring-1 ring-soft lg:p-5">
        <Link href="/" aria-label="Bluffy home" className="flex items-center justify-center px-1 pb-2 pt-1 lg:justify-start lg:px-2">
          <span className="hidden lg:inline-flex">
            <Logo />
          </span>
          <span className="inline-flex lg:hidden">
            <Logo compact />
          </span>
        </Link>

        <nav className="mt-6 flex-1 space-y-1">
          {dashboardNav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "flex items-center justify-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors lg:justify-start lg:px-4",
                  active ? "bg-primary text-white shadow-[0_8px_20px_-6px_rgb(40_117_251/0.6)]" : "text-navy/65 hover:bg-primary/10 hover:text-primary",
                )}
              >
                <Icon size={18} />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-soft pt-3">
          <button
            type="button"
            onClick={() => toast("Help Center is coming soon.", "info")}
            title="Help Center"
            className="flex w-full items-center justify-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-navy/65 transition-colors hover:bg-primary/10 hover:text-primary lg:justify-start lg:px-4"
          >
            <HelpCircle size={18} />
            <span className="hidden lg:inline">Help Center</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className="flex w-full items-center justify-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 lg:justify-start lg:px-4"
          >
            <LogOut size={18} />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
