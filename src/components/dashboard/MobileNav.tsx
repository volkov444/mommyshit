"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { dashboardNav } from "@/lib/dashboard/nav";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Dashboard"
      className="fixed inset-x-3 bottom-3 z-40 flex items-stretch justify-between rounded-2xl bg-white px-1.5 py-1.5 shadow-lift ring-1 ring-soft backdrop-blur-xl md:hidden"
    >
      {dashboardNav.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition-colors",
              active ? "bg-primary/10 text-primary" : "text-navy/45",
            )}
          >
            <Icon size={20} className={cn(active && "drop-shadow-[0_2px_6px_rgb(40_117_251/0.4)]")} />
            <span className={cn("text-[11px] font-semibold leading-none", active ? "text-primary" : "text-navy/45")}>
              {item.mobileLabel}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
