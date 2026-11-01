"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Package, Plus, Smartphone, Wallet } from "lucide-react";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { MobileQuickActions } from "@/components/dashboard/MobileQuickActions";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { TransactionsTable } from "@/components/dashboard/TransactionsTable";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { useUser } from "@/components/dashboard/UserProvider";
import { getOrders, getOverviewStats, getRecentTransactions } from "@/lib/dashboard/api";
import { formatCurrency } from "@/lib/format";
import type { Order, Transaction } from "@/lib/dashboard/types";

const quickActions = [
  { label: "Buy New Number", href: "/dashboard/buy-number", icon: Smartphone },
  { label: "Add Balance", href: "/dashboard/topup", icon: Plus },
  { label: "View Orders", href: "/dashboard/orders", icon: Package },
];

export function OverviewView() {
  const { user } = useUser();
  const [stats, setStats] = useState<{ totalOrders: number; activeNumbers: number; completedOrders: number; totalSpending: number } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getOverviewStats(), getRecentTransactions(5), getOrders()]).then(
      ([s, t, o]) => {
        if (!active) return;
        setStats(s);
        setTransactions(t);
        setOrders(o.slice(0, 5));
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
          Overview
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
          Welcome back, {user?.name.split(" ")[0] ?? "friend"}!
        </h1>
        <p className="mt-1.5 text-navy/60">Manage your virtual numbers and account in one place.</p>
      </div>

      <BalanceCard />

      <MobileQuickActions />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Package} label="Total Orders" value={String(stats?.totalOrders ?? 0)} loading={loading} />
        <StatCard icon={Smartphone} label="Active Numbers" value={String(stats?.activeNumbers ?? 0)} loading={loading} />
        <StatCard icon={CheckCircle2} label="Completed Orders" value={String(stats?.completedOrders ?? 0)} loading={loading} />
        <StatCard icon={Wallet} label="Total Spending" value={formatCurrency(stats?.totalSpending ?? 0)} loading={loading} />
      </div>

      <SectionCard title="Quick Actions">
        <div className="grid gap-3 sm:grid-cols-3">
          {quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex items-center gap-3 rounded-2xl bg-canvas px-4 py-4 ring-1 ring-soft/70 transition-all hover:-translate-y-0.5 hover:bg-primary/10"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-white">
                <a.icon size={17} />
              </span>
              <span className="text-sm font-bold text-navy">{a.label}</span>
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Recent Transactions"
        action={
          <Link href="/dashboard/orders" className="text-sm font-bold text-primary hover:text-deep">
            View All
          </Link>
        }
      >
        <TransactionsTable transactions={transactions} loading={loading} />
      </SectionCard>

      <SectionCard
        title="Recent Orders"
        action={
          <Link href="/dashboard/orders" className="text-sm font-bold text-primary hover:text-deep">
            View All
          </Link>
        }
      >
        <OrdersTable orders={orders} loading={loading} compact />
      </SectionCard>
    </div>
  );
}
