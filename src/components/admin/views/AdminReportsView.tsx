"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { AdminLineChart } from "@/components/admin/charts/AdminLineChart";
import { AdminBarChart } from "@/components/admin/charts/AdminBarChart";
import { useToast } from "@/components/dashboard/ToastProvider";
import { dailyCount, dailySum } from "@/lib/admin/dailySeries";
import { downloadCsv } from "@/lib/admin/csv";
import { getUsers } from "@/lib/admin/usersStore";
import { getDeposits } from "@/lib/admin/depositsStore";
import { getAllOrders } from "@/lib/admin/ordersStore";
import { formatDate, formatCurrency, formatNumber } from "@/lib/format";

const RANGES = [7, 14, 30] as const;

type RawData = { orders: Awaited<ReturnType<typeof getAllOrders>>; deposits: Awaited<ReturnType<typeof getDeposits>>; users: Awaited<ReturnType<typeof getUsers>> };

export function AdminReportsView() {
  const toast = useToast();
  const [days, setDays] = useState<number>(14);
  const [raw, setRaw] = useState<RawData | null>(null);

  useEffect(() => {
    Promise.all([getDeposits(), getAllOrders(), getUsers()]).then(([deposits, orders, users]) => {
      setRaw({ orders, deposits, users });
    });
  }, []);

  const derived = useMemo(() => {
    if (!raw) return null;
    const revenueOrders = raw.orders.filter((o) => o.status === "completed" || o.status === "active");
    return {
      totals: {
        sales: revenueOrders.reduce((sum, o) => sum + o.price, 0),
        profit: revenueOrders.reduce((sum, o) => sum + (o.price - o.supplierPrice), 0),
        deposit: raw.deposits.filter((d) => d.status === "success").reduce((sum, d) => sum + d.amount, 0),
        orders: raw.orders.length,
        newUsers: raw.users.length,
      },
      salesSeries: dailySum(revenueOrders.map((o) => ({ date: o.createdAt, amount: o.price })), days),
      profitSeries: dailySum(revenueOrders.map((o) => ({ date: o.createdAt, amount: o.price - o.supplierPrice })), days),
      depositSeries: dailySum(raw.deposits.filter((d) => d.status === "success").map((d) => ({ date: d.createdAt, amount: d.amount })), days),
      userSeries: dailyCount(raw.users.map((u) => u.joinedAt), days),
      orderSeries: dailyCount(raw.orders.map((o) => o.createdAt), days),
    };
  }, [raw, days]);

  const totals = derived?.totals ?? null;
  const salesSeries = derived?.salesSeries ?? [];
  const depositSeries = derived?.depositSeries ?? [];
  const profitSeries = derived?.profitSeries ?? [];
  const userSeries = derived?.userSeries ?? [];
  const orderSeries = derived?.orderSeries ?? [];

  function exportSeries(name: string, label: string, series: { date: string; value: number }[]) {
    downloadCsv(
      `${name}-${Date.now()}.csv`,
      series.map((p) => ({ Tanggal: formatDate(p.date), [label]: p.value })),
    );
    toast(`Laporan ${label.toLowerCase()} berhasil diekspor.`, "success");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">Laporan</h1>
          <p className="mt-1.5 text-navy/60">Laporan penjualan, deposit, profit, pengguna, dan pesanan.</p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setDays(r)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                days === r ? "bg-primary text-white" : "bg-canvas text-navy/60 ring-1 ring-soft hover:text-primary"
              }`}
            >
              {r} Hari
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: "Total Penjualan", value: totals ? formatCurrency(totals.sales) : "—" },
          { label: "Total Profit", value: totals ? formatCurrency(totals.profit) : "—" },
          { label: "Total Deposit", value: totals ? formatCurrency(totals.deposit) : "—" },
          { label: "Total Pesanan", value: totals ? formatNumber(totals.orders) : "—" },
          { label: "Total Pengguna", value: totals ? formatNumber(totals.newUsers) : "—" },
        ].map((card) => (
          <div key={card.label} className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-soft">
            <p className="text-sm font-semibold text-navy/55">{card.label}</p>
            <p className="mt-1.5 text-xl font-extrabold tracking-tight text-navy">{card.value}</p>
          </div>
        ))}
      </div>

      <SectionCard
        title="Laporan Penjualan"
        action={
          <button type="button" onClick={() => exportSeries("laporan-penjualan", "Penjualan", salesSeries)} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-deep">
            <Download size={14} />
            Ekspor CSV
          </button>
        }
      >
        <AdminBarChart data={salesSeries} valueLabel="penjualan" formatValue={formatCurrency} />
      </SectionCard>

      <SectionCard
        title="Laporan Deposit"
        action={
          <button type="button" onClick={() => exportSeries("laporan-deposit", "Deposit", depositSeries)} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-deep">
            <Download size={14} />
            Ekspor CSV
          </button>
        }
      >
        <AdminLineChart data={depositSeries} valueLabel="deposit" formatValue={formatCurrency} />
      </SectionCard>

      <SectionCard
        title="Laporan Profit"
        action={
          <button type="button" onClick={() => exportSeries("laporan-profit", "Profit", profitSeries)} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-deep">
            <Download size={14} />
            Ekspor CSV
          </button>
        }
      >
        <AdminLineChart data={profitSeries} valueLabel="profit" formatValue={formatCurrency} />
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Laporan Pengguna Baru"
          action={
            <button type="button" onClick={() => exportSeries("laporan-pengguna", "Pengguna Baru", userSeries)} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-deep">
              <Download size={14} />
              Ekspor CSV
            </button>
          }
        >
          <AdminLineChart data={userSeries} valueLabel="pengguna baru" />
        </SectionCard>

        <SectionCard
          title="Laporan Pesanan"
          action={
            <button type="button" onClick={() => exportSeries("laporan-pesanan", "Pesanan", orderSeries)} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-deep">
              <Download size={14} />
              Ekspor CSV
            </button>
          }
        >
          <AdminBarChart data={orderSeries} valueLabel="pesanan" />
        </SectionCard>
      </div>
    </div>
  );
}
