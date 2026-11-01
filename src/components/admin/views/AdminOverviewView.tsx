"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  CreditCard,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
  WalletMinimal,
} from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { Flag } from "@/components/dashboard/Flag";
import { Skeleton } from "@/components/dashboard/Skeleton";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { Badge } from "@/components/dashboard/Badge";
import { AdminLineChart } from "@/components/admin/charts/AdminLineChart";
import { AdminBarChart } from "@/components/admin/charts/AdminBarChart";
import { getUsers, getDeposits, getTransactions, getActivityLog } from "@/lib/admin/store";
import { getTotalBalance } from "@/lib/admin/usersStore";
import { getAllOrders } from "@/lib/admin/ordersStore";
import { dailyCount, dailySum, type DailyPoint } from "@/lib/admin/dailySeries";
import { formatDateTime, formatCurrency, formatNumber } from "@/lib/format";
import type { User } from "@/lib/dashboard/types";
import type { AdminActivityLogEntry } from "@/lib/admin/types";

type Stats = {
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  activeOrders: number;
  totalDeposit: number;
  totalSales: number;
  platformRevenue: number;
  totalUserBalance: number;
};

type OverviewData = {
  stats: Stats;
  txSeries: DailyPoint[];
  userSeries: DailyPoint[];
  salesSeries: DailyPoint[];
  recentTransactions: Awaited<ReturnType<typeof getTransactions>>;
  recentOrders: Awaited<ReturnType<typeof getAllOrders>>;
  recentUsers: User[];
  recentActivity: AdminActivityLogEntry[];
  usersById: Map<string, User>;
};

async function buildOverviewData(): Promise<OverviewData> {
  const [users, deposits, transactions, totalUserBalance, orders] = await Promise.all([
    getUsers(),
    getDeposits(),
    getTransactions(),
    getTotalBalance(),
    getAllOrders(),
  ]);
  const usersById = new Map(users.map((u) => [u.id, u]));

  const revenueOrders = orders.filter((o) => o.status === "completed" || o.status === "active");

  const stats: Stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === "active").length,
    totalOrders: orders.length,
    activeOrders: orders.filter((o) => o.status === "active").length,
    totalDeposit: deposits.filter((d) => d.status === "success").reduce((sum, d) => sum + d.amount, 0),
    totalSales: revenueOrders.reduce((sum, o) => sum + o.price, 0),
    platformRevenue: revenueOrders.reduce((sum, o) => sum + (o.price - o.supplierPrice), 0),
    totalUserBalance,
  };

  return {
    stats,
    txSeries: dailyCount(transactions.map((t) => t.date), 14),
    userSeries: dailyCount(users.map((u) => u.joinedAt), 14),
    salesSeries: dailySum(revenueOrders.map((o) => ({ date: o.createdAt, amount: o.price })), 14),
    recentTransactions: transactions.slice(0, 5),
    recentOrders: orders.slice(0, 5),
    recentUsers: [...users].sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()).slice(0, 5),
    recentActivity: getActivityLog().slice(0, 5),
    usersById,
  };
}

export function AdminOverviewView() {
  const [data, setData] = useState<OverviewData | null>(null);

  useEffect(() => {
    buildOverviewData().then(setData);
  }, []);

  const loading = !data;

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
          Dashboard
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">Selamat datang kembali, Admin!</h1>
        <p className="mt-1.5 text-navy/60">Pantau dan kelola seluruh aktivitas platform Bluffy.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Pengguna" value={formatNumber(data?.stats.totalUsers ?? 0)} loading={loading} />
        <StatCard icon={Activity} label="Pengguna Aktif" value={formatNumber(data?.stats.activeUsers ?? 0)} loading={loading} />
        <StatCard icon={ShoppingBag} label="Total Pesanan" value={formatNumber(data?.stats.totalOrders ?? 0)} loading={loading} />
        <StatCard icon={Package} label="Pesanan Aktif" value={formatNumber(data?.stats.activeOrders ?? 0)} loading={loading} />
        <StatCard icon={Wallet} label="Total Deposit" value={formatCurrency(data?.stats.totalDeposit ?? 0)} loading={loading} />
        <StatCard icon={TrendingUp} label="Total Penjualan" value={formatCurrency(data?.stats.totalSales ?? 0)} loading={loading} />
        <StatCard icon={CreditCard} label="Pendapatan Platform" value={formatCurrency(data?.stats.platformRevenue ?? 0)} loading={loading} />
        <StatCard icon={WalletMinimal} label="Total Saldo Pengguna" value={formatCurrency(data?.stats.totalUserBalance ?? 0)} loading={loading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Transaksi Harian" description="14 hari terakhir">
          <AdminLineChart data={data?.txSeries ?? []} valueLabel="transaksi" />
        </SectionCard>
        <SectionCard title="Pertumbuhan Pengguna" description="14 hari terakhir">
          <AdminLineChart data={data?.userSeries ?? []} valueLabel="pengguna baru" />
        </SectionCard>
        <SectionCard title="Penjualan" description="14 hari terakhir">
          <AdminBarChart data={data?.salesSeries ?? []} valueLabel="penjualan" formatValue={formatCurrency} />
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Transaksi Terbaru"
          action={<Link href="/admin/transactions" className="text-sm font-bold text-primary hover:text-deep">Lihat Semua</Link>}
        >
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : data.recentTransactions.length === 0 ? (
            <p className="py-6 text-center text-sm text-navy/50">Belum ada transaksi.</p>
          ) : (
            <div className="space-y-1">
              {data.recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 hover:bg-canvas">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy">{data.usersById.get(t.userId)?.name ?? t.userId}</p>
                    <p className="truncate text-xs text-navy/50">{t.description}</p>
                  </div>
                  <p className={`shrink-0 text-sm font-bold ${t.amount >= 0 ? "text-emerald-600" : "text-navy"}`}>
                    {t.amount >= 0 ? "+" : ""}{formatCurrency(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Pesanan Terbaru"
          action={<Link href="/admin/orders" className="text-sm font-bold text-primary hover:text-deep">Lihat Semua</Link>}
        >
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : data.recentOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-navy/50">Belum ada pesanan.</p>
          ) : (
            <div className="space-y-1">
              {data.recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 hover:bg-canvas">
                  <div className="flex min-w-0 items-center gap-2">
                    <Flag code={o.countryCode} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy">{o.serviceName}</p>
                      <p className="truncate text-xs text-navy/50">{data.usersById.get(o.userId)?.name ?? o.userId}</p>
                    </div>
                  </div>
                  <Badge status={o.status} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Pengguna Terbaru"
          action={<Link href="/admin/users" className="text-sm font-bold text-primary hover:text-deep">Lihat Semua</Link>}
        >
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="space-y-1">
              {data.recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 hover:bg-canvas">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy">{u.name}</p>
                    <p className="truncate text-xs text-navy/50">{u.email}</p>
                  </div>
                  <AdminBadge status={u.status} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Aktivitas Admin">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : data.recentActivity.length === 0 ? (
            <p className="py-6 text-center text-sm text-navy/50">Belum ada aktivitas.</p>
          ) : (
            <div className="space-y-1">
              {data.recentActivity.map((a) => (
                <div key={a.id} className="rounded-xl px-2 py-2.5 hover:bg-canvas">
                  <p className="text-sm font-semibold text-navy">{a.action}</p>
                  <p className="mt-0.5 text-xs text-navy/50">{formatDateTime(a.at)}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
