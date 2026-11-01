"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Pagination } from "@/components/dashboard/Pagination";
import { AdminUsersTable } from "./AdminUsersTable";
import { getUsers } from "@/lib/admin/usersStore";
import { getAllOrders } from "@/lib/admin/ordersStore";
import type { User, UserStatus } from "@/lib/dashboard/types";

const PAGE_SIZE = 10;

type StatusFilter = "all" | UserStatus;

export function AdminUsersView() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [orderCounts, setOrderCounts] = useState<Map<string, number>>(new Map());
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    getUsers().then(setUsers);
    getAllOrders().then((orders) => {
      const counts = new Map<string, number>();
      for (const order of orders) {
        counts.set(order.userId, (counts.get(order.userId) ?? 0) + 1);
      }
      setOrderCounts(counts);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => status === "all" || u.status === status)
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q))
      .map((u) => ({ ...u, orderCount: orderCounts.get(u.id) ?? 0 }));
  }, [users, query, status, orderCounts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">Manajemen Pengguna</h1>
        <p className="mt-1.5 text-navy/60">Kelola akun, saldo, dan status seluruh pengguna Bluffy.</p>
      </div>

      <SectionCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-72">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/35" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama, email, atau ID..."
              className="w-full rounded-full bg-canvas py-2.5 pl-9 pr-4 text-sm text-navy ring-1 ring-soft placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "blocked"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                  status === s ? "bg-primary text-white" : "bg-canvas text-navy/60 ring-1 ring-soft hover:text-primary"
                }`}
              >
                {s === "all" ? "Semua" : s === "active" ? "Aktif" : "Diblokir"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <AdminUsersTable users={pageRows} loading={!users} />
        </div>

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </SectionCard>
    </div>
  );
}
