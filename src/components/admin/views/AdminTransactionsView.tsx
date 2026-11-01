"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Pagination } from "@/components/dashboard/Pagination";
import { useToast } from "@/components/dashboard/ToastProvider";
import { AdminTransactionsTable } from "./AdminTransactionsTable";
import { getTransactions } from "@/lib/admin/transactionsStore";
import { getUsers } from "@/lib/admin/usersStore";
import { downloadCsv } from "@/lib/admin/csv";
import { formatDateTime } from "@/lib/format";
import type { Transaction, TransactionType } from "@/lib/dashboard/types";

const PAGE_SIZE = 10;
type Row = Transaction & { userName: string };
type TypeFilter = "all" | TransactionType;
type StatusFilter = "all" | Transaction["status"];

const TYPE_LABELS: Record<TransactionType, string> = {
  deposit: "Deposit",
  purchase: "Pembelian Nomor",
  refund: "Refund",
  adjustment: "Penyesuaian Saldo",
};

export function AdminTransactionsView() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([getUsers(), getTransactions()]).then(([allUsers, transactions]) => {
      const usersById = new Map(allUsers.map((u) => [u.id, u.name]));
      setRows(transactions.map((t) => ({ ...t, userName: usersById.get(t.userId) ?? t.userId })));
    });
    const q = new URLSearchParams(window.location.search).get("q");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the ?q= query param on mount, not a render-triggered sync
    if (q) setQuery(q);
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    return rows
      .filter((t) => typeFilter === "all" || t.type === typeFilter)
      .filter((t) => statusFilter === "all" || t.status === statusFilter)
      .filter((t) => !q || t.userName.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }, [rows, query, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleExport() {
    if (filtered.length === 0) {
      toast("Tidak ada data untuk diekspor.", "error");
      return;
    }
    downloadCsv(
      `transaksi-${Date.now()}.csv`,
      filtered.map((t) => ({
        "Transaction ID": t.id,
        User: t.userName,
        Tipe: TYPE_LABELS[t.type],
        Nominal: t.amount,
        Status: t.status,
        Tanggal: formatDateTime(t.date),
      })),
    );
    toast("Data transaksi berhasil diekspor.", "success");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">Manajemen Transaksi</h1>
        <p className="mt-1.5 text-navy/60">Pantau seluruh deposit, pembelian, refund, dan penyesuaian saldo.</p>
      </div>

      <SectionCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-64">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/35" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Cari user, ID, deskripsi..."
              className="w-full rounded-full bg-canvas py-2.5 pl-9 pr-4 text-sm text-navy ring-1 ring-soft placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as TypeFilter);
                setPage(1);
              }}
              className="rounded-full bg-canvas px-4 py-2.5 text-xs font-bold text-navy ring-1 ring-soft focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">Semua Tipe</option>
              <option value="deposit">Deposit</option>
              <option value="purchase">Pembelian Nomor</option>
              <option value="refund">Refund</option>
              <option value="adjustment">Penyesuaian Saldo</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setPage(1);
              }}
              className="rounded-full bg-canvas px-4 py-2.5 text-xs font-bold text-navy ring-1 ring-soft focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">Semua Status</option>
              <option value="completed">Berhasil</option>
              <option value="pending">Pending</option>
              <option value="failed">Gagal</option>
            </select>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_-6px_rgb(40_117_251/0.6)] transition-opacity hover:opacity-90"
            >
              <Download size={14} />
              Ekspor CSV
            </button>
          </div>
        </div>

        <div className="mt-5">
          <AdminTransactionsTable transactions={pageRows} loading={!rows} />
        </div>

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </SectionCard>
    </div>
  );
}
