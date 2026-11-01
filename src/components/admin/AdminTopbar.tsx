"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, LogOut, Menu, Search, UserCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/dashboard/ToastProvider";
import { Skeleton } from "@/components/dashboard/Skeleton";
import { getUsers } from "@/lib/admin/usersStore";
import { getAllOrders } from "@/lib/admin/ordersStore";
import { getServices } from "@/lib/admin/servicesStore";
import { getTransactions } from "@/lib/admin/transactionsStore";
import type { User } from "@/lib/dashboard/types";

const notifications = [
  { id: 1, text: "Deposit baru menunggu persetujuan.", time: "5 menit lalu" },
  { id: 2, text: "Tiket customer service baru dibuka.", time: "1 jam lalu" },
  { id: 3, text: "Stok nomor WhatsApp — Indonesia menipis.", time: "3 jam lalu" },
];

type Props = {
  title: string;
  adminUser: User | null;
  onOpenMenu: () => void;
};

export function AdminTopbar({ title, adminUser, onOpenMenu }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [openBell, setOpenBell] = useState(false);
  const [openAvatar, setOpenAvatar] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenBell(false);
        setOpenAvatar(false);
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleLogout() {
    toast("Berhasil keluar. Sampai jumpa lagi!", "success");
    router.push("/login");
  }

  // Global search across the shared admin stores.
  const [results, setResults] = useState<{
    users: User[];
    orders: Awaited<ReturnType<typeof getAllOrders>>;
    services: Awaited<ReturnType<typeof getServices>>;
    transactions: Awaited<ReturnType<typeof getTransactions>>;
  } | null>(null);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing results synchronously when the search query empties, not a render-triggered sync
      setResults(null);
      return;
    }
    let cancelled = false;
    Promise.all([getServices(), getTransactions(), getAllOrders(), getUsers()]).then(([allServices, allTransactions, allOrders, allUsers]) => {
      if (cancelled) return;
      const users = allUsers
        .filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
        .slice(0, 4);
      const orders = allOrders
        .filter((o) => o.id.toLowerCase().includes(q) || o.phoneNumber.toLowerCase().includes(q) || o.serviceName.toLowerCase().includes(q))
        .slice(0, 4);
      const services = allServices.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 4);
      const transactions = allTransactions.filter((t) => t.id.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)).slice(0, 4);
      setResults({ users, orders, services, transactions });
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const hasResults = !!results && results.users.length + results.orders.length + results.services.length + results.transactions.length > 0;

  function goTo(path: string) {
    setQuery("");
    setSearchOpen(false);
    router.push(path);
  }

  const initial = adminUser?.name.charAt(0).toUpperCase() ?? "?";

  return (
    <div ref={ref} className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Buka menu"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-canvas text-navy ring-1 ring-soft md:hidden"
        >
          <Menu size={18} />
        </button>
        <h1 className="truncate text-lg font-extrabold tracking-tight text-navy sm:text-xl">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative hidden sm:block">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/35" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Cari..."
            className="w-40 rounded-full bg-canvas py-2.5 pl-9 pr-4 text-sm text-navy ring-1 ring-soft placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-primary/40 lg:w-56"
          />
          <AnimatePresence>
            {searchOpen && results && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="absolute left-0 top-12 w-80 overflow-hidden rounded-2xl bg-white p-2 shadow-lift ring-1 ring-soft"
              >
                {!hasResults ? (
                  <p className="px-3 py-4 text-center text-sm text-navy/45">Tidak ada hasil untuk &quot;{query}&quot;.</p>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    {results.users.length > 0 && (
                      <div className="mb-1">
                        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-navy/40">Pengguna</p>
                        {results.users.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => goTo(`/admin/users/${u.id}`)}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-canvas"
                          >
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {u.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-navy">{u.name}</span>
                              <span className="block truncate text-xs text-navy/45">{u.email}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {results.orders.length > 0 && (
                      <div className="mb-1">
                        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-navy/40">Pesanan</p>
                        {results.orders.map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => goTo(`/admin/orders?q=${encodeURIComponent(o.id)}`)}
                            className="flex w-full flex-col items-start rounded-xl px-3 py-2 text-left hover:bg-canvas"
                          >
                            <span className="truncate text-sm font-semibold text-navy">
                              {o.id} — {o.serviceName}
                            </span>
                            <span className="truncate text-xs text-navy/45">
                              {o.phoneNumber} · {o.countryName}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {results.services.length > 0 && (
                      <div className="mb-1">
                        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-navy/40">Layanan</p>
                        {results.services.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => goTo(`/admin/services?q=${encodeURIComponent(s.name)}`)}
                            className="flex w-full items-center rounded-xl px-3 py-2 text-left hover:bg-canvas"
                          >
                            <span className="truncate text-sm font-semibold text-navy">{s.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {results.transactions.length > 0 && (
                      <div>
                        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-navy/40">Transaksi</p>
                        {results.transactions.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => goTo(`/admin/transactions?q=${encodeURIComponent(t.id)}`)}
                            className="flex w-full flex-col items-start rounded-xl px-3 py-2 text-left hover:bg-canvas"
                          >
                            <span className="truncate text-sm font-semibold text-navy">{t.id}</span>
                            <span className="truncate text-xs text-navy/45">{t.description}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setOpenBell((v) => !v);
              setOpenAvatar(false);
            }}
            aria-label="Notifikasi"
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
                <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-navy/40">Notifikasi</p>
                {notifications.map((n) => (
                  <div key={n.id} className="rounded-xl px-3 py-2.5 hover:bg-canvas">
                    <p className="text-sm font-medium text-navy">{n.text}</p>
                    <p className="mt-0.5 text-xs text-navy/45">{n.time}</p>
                  </div>
                ))}
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
            aria-label="Menu akun"
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1 sm:pr-3 sm:ring-1 sm:ring-soft"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-bold text-white">{initial}</span>
            <span className="hidden text-left sm:block">
              {adminUser ? (
                <>
                  <span className="block text-sm font-bold leading-tight text-navy">{adminUser.name}</span>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                    Administrator
                  </span>
                </>
              ) : (
                <Skeleton className="h-4 w-20" />
              )}
            </span>
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
                  <p className="truncate text-sm font-bold text-navy">{adminUser?.name}</p>
                  <p className="truncate text-xs text-navy/50">{adminUser?.email}</p>
                </div>
                <Link
                  href="/admin/settings"
                  onClick={() => setOpenAvatar(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-navy/70 transition-colors hover:bg-primary/10 hover:text-primary",
                  )}
                >
                  <UserCircle size={17} />
                  Pengaturan
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
                >
                  <LogOut size={17} />
                  Keluar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
