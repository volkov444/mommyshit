"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, LogOut, UserCircle, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import { getRecentTransactions } from "@/lib/dashboard/api";
import { logout } from "@/lib/auth";
import { useUser } from "./UserProvider";
import { useToast } from "./ToastProvider";
import { Skeleton } from "./Skeleton";
import type { Transaction } from "@/lib/dashboard/types";

export function Topbar() {
  const { user } = useUser();
  const router = useRouter();
  const toast = useToast();
  const [openBell, setOpenBell] = useState(false);
  const [openAvatar, setOpenAvatar] = useState(false);
  const [notifications, setNotifications] = useState<Transaction[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenBell(false);
        setOpenAvatar(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    getRecentTransactions(5).then(setNotifications);
  }, []);

  async function handleLogout() {
    await logout();
    toast("Signed out. See you soon!", "success");
    router.replace("/login");
  }

  const initial = user?.name.charAt(0).toUpperCase() ?? "?";

  return (
    <div ref={ref} className="flex items-center justify-between gap-3">
      <div>
        {user ? (
          <p className="text-sm font-semibold text-navy/55">
            Welcome back, <span className="text-navy">{user.name.split(" ")[0]}</span>!
          </p>
        ) : (
          <Skeleton className="h-5 w-40" />
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-2 text-xs font-bold text-primary sm:gap-2 sm:px-4 sm:text-sm">
          <Wallet size={16} />
          {user ? formatCurrency(user.balance) : <Skeleton className="h-4 w-16" />}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setOpenBell((v) => !v);
              setOpenAvatar(false);
            }}
            aria-label="Notifications"
            className="grid h-10 w-10 place-items-center rounded-full bg-canvas text-navy ring-1 ring-soft transition-colors hover:bg-white"
          >
            <Bell size={18} />
          </button>
          <AnimatePresence>
            {openBell && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-12 w-72 overflow-hidden rounded-2xl bg-white p-2 shadow-lift ring-1 ring-soft"
              >
                <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-navy/40">
                  Notifications
                </p>
                {notifications === null ? (
                  <div className="space-y-2 p-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-navy/45">No notifications yet.</p>
                ) : (
                  notifications.map((t) => (
                    <div key={t.id} className="rounded-xl px-3 py-2.5 hover:bg-canvas">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-navy">{t.description}</p>
                        <span className={cn("shrink-0 text-xs font-bold", t.amount >= 0 ? "text-emerald-600" : "text-navy/60")}>
                          {t.amount >= 0 ? "+" : ""}
                          {formatCurrency(t.amount)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-navy/45">{formatRelativeTime(t.date)}</p>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setOpenAvatar((v) => !v);
              setOpenBell(false);
            }}
            aria-label="Account menu"
            className="grid h-10 w-10 place-items-center rounded-full bg-primary font-bold text-white"
          >
            {initial}
          </button>
          <AnimatePresence>
            {openAvatar && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl bg-white p-2 shadow-lift ring-1 ring-soft"
              >
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-bold text-navy">{user?.name}</p>
                  <p className="truncate text-xs text-navy/50">{user?.email}</p>
                </div>
                <Link
                  href="/dashboard/profile"
                  onClick={() => setOpenAvatar(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-navy/70 transition-colors hover:bg-primary/10 hover:text-primary",
                  )}
                >
                  <UserCircle size={17} />
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
