"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, CheckCircle2, Wallet } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { TransactionsTable } from "@/components/dashboard/TransactionsTable";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { useToast } from "@/components/dashboard/ToastProvider";
import { getUserById, setUserStatus } from "@/lib/admin/usersStore";
import { getTransactionsForUser } from "@/lib/admin/transactionsStore";
import { getOrdersForUser } from "@/lib/admin/ordersStore";
import { getSession } from "@/lib/admin/session";
import { formatDate, formatCurrency } from "@/lib/format";
import type { Order, Transaction, User } from "@/lib/dashboard/types";
import { AdminBalanceAdjustSheet } from "./AdminBalanceAdjustSheet";

export function AdminUserDetailView({ userId }: { userId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    getUserById(userId).then((found) => setUser(found ?? null));
    getOrdersForUser(userId).then(setOrders);
    getTransactionsForUser(userId).then(setTransactions);
  }, [userId]);

  if (user === undefined) return null;

  if (user === null) {
    return (
      <SectionCard>
        <p className="text-sm text-navy/60">Pengguna tidak ditemukan.</p>
        <Link href="/admin/users" className="mt-3 inline-block text-sm font-bold text-primary">
          Kembali ke daftar pengguna
        </Link>
      </SectionCard>
    );
  }

  const purchaseTotal = orders.reduce((sum, o) => sum + o.price, 0);
  const depositTotal = transactions.filter((t) => t.type === "deposit" && t.amount > 0).reduce((sum, t) => sum + t.amount, 0);

  async function handleToggleStatus() {
    const session = getSession();
    const nextStatus: User["status"] = user!.status === "active" ? "blocked" : "active";
    const ok = await setUserStatus(user!.id, nextStatus, session.userId);
    if (!ok) {
      toast("Gagal mengubah status akun.", "error");
      return;
    }
    const updated = { ...user!, status: nextStatus };
    setUser(updated);
    toast(`Akun ${updated.name} berhasil ${nextStatus === "blocked" ? "diblokir" : "diaktifkan"}.`, "success");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => router.push("/admin/users")}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-deep"
        >
          <ArrowLeft size={15} />
          Kembali ke Pengguna
        </button>
      </div>

      <SectionCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold tracking-tight text-navy">{user.name}</h1>
              <AdminBadge status={user.status} />
            </div>
            <p className="mt-1 text-sm text-navy/60">{user.email}</p>
            <p className="mt-0.5 font-mono text-xs text-navy/45">{user.id}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgb(40_117_251/0.6)] transition-opacity hover:opacity-90"
            >
              <Wallet size={15} />
              Sesuaikan Saldo
            </button>
            <button
              type="button"
              onClick={handleToggleStatus}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold ring-1 transition-colors ${
                user.status === "active" ? "bg-red-50 text-red-500 ring-red-100 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 ring-emerald-100 hover:bg-emerald-100"
              }`}
            >
              {user.status === "active" ? <Ban size={15} /> : <CheckCircle2 size={15} />}
              {user.status === "active" ? "Blokir Akun" : "Aktifkan Akun"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl bg-canvas p-4 ring-1 ring-soft/70">
            <p className="text-xs font-semibold text-navy/50">Saldo Saat Ini</p>
            <p className="mt-1 text-lg font-extrabold text-navy">{formatCurrency(user.balance)}</p>
          </div>
          <div className="rounded-2xl bg-canvas p-4 ring-1 ring-soft/70">
            <p className="text-xs font-semibold text-navy/50">Total Deposit</p>
            <p className="mt-1 text-lg font-extrabold text-navy">{formatCurrency(depositTotal)}</p>
          </div>
          <div className="rounded-2xl bg-canvas p-4 ring-1 ring-soft/70">
            <p className="text-xs font-semibold text-navy/50">Total Pembelian</p>
            <p className="mt-1 text-lg font-extrabold text-navy">{formatCurrency(purchaseTotal)}</p>
          </div>
          <div className="rounded-2xl bg-canvas p-4 ring-1 ring-soft/70">
            <p className="text-xs font-semibold text-navy/50">Tanggal Bergabung</p>
            <p className="mt-1 text-lg font-extrabold text-navy">{formatDate(user.joinedAt)}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Riwayat Pesanan">
        <OrdersTable orders={orders} />
      </SectionCard>

      <SectionCard title="Riwayat Transaksi">
        <TransactionsTable transactions={transactions} />
      </SectionCard>

      <AdminBalanceAdjustSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        user={user}
        onAdjusted={(updated) => {
          setUser(updated);
          getTransactionsForUser(userId).then(setTransactions);
        }}
      />
    </div>
  );
}
