"use client";

import { useEffect, useMemo, useState } from "react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Pagination } from "@/components/dashboard/Pagination";
import { useToast } from "@/components/dashboard/ToastProvider";
import { AdminDepositsTable } from "./AdminDepositsTable";
import { AdminDepositDetailSheet } from "./AdminDepositDetailSheet";
import { getDeposits, approveDeposit, rejectDeposit } from "@/lib/admin/depositsStore";
import { getUsers } from "@/lib/admin/usersStore";
import { getSession } from "@/lib/admin/session";
import { paymentMethods } from "@/lib/dashboard/data";
import type { Deposit, DepositStatus } from "@/lib/admin/types";

const PAGE_SIZE = 10;
type Row = Deposit & { userName: string; methodLabel: string };
type Filter = "all" | DepositStatus;

function enrich(deposits: Deposit[], usersById: Map<string, string>): Row[] {
  return deposits.map((d) => ({
    ...d,
    userName: usersById.get(d.userId) ?? d.userId,
    methodLabel: paymentMethods.find((m) => m.id === d.methodId)?.label ?? d.methodId,
  }));
}

export function AdminDepositsView() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Row | null>(null);

  async function reload() {
    const allUsers = await getUsers();
    const usersById = new Map(allUsers.map((u) => [u.id, u.name]));
    setRows(enrich(await getDeposits(), usersById));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the shared store on mount, not a render-triggered sync
    reload();
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    return filter === "all" ? rows : rows.filter((d) => d.status === filter);
  }, [rows, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleApprove(deposit: Row) {
    const session = getSession();
    const updated = await approveDeposit(deposit.id, session.userId);
    if (!updated) return;
    await reload();
    setSelected(null);
    toast(`Deposit ${deposit.id} disetujui, saldo ${deposit.userName} bertambah ${deposit.amount.toLocaleString("id-ID")}.`, "success");
  }

  async function handleReject(deposit: Row) {
    const session = getSession();
    const updated = await rejectDeposit(deposit.id, session.userId);
    if (!updated) return;
    await reload();
    setSelected(null);
    toast(`Deposit ${deposit.id} ditolak.`, "info");
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "Semua" },
    { key: "pending", label: "Pending" },
    { key: "success", label: "Berhasil" },
    { key: "failed", label: "Gagal" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">Manajemen Deposit</h1>
        <p className="mt-1.5 text-navy/60">Tinjau dan setujui permintaan deposit pengguna.</p>
      </div>

      <SectionCard>
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setFilter(f.key);
                setPage(1);
              }}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                filter === f.key ? "bg-primary text-white" : "bg-canvas text-navy/60 ring-1 ring-soft hover:text-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          <AdminDepositsTable deposits={pageRows} loading={!rows} onViewDetails={setSelected} />
        </div>

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </SectionCard>

      <AdminDepositDetailSheet deposit={selected} onClose={() => setSelected(null)} onApprove={handleApprove} onReject={handleReject} />
    </div>
  );
}
