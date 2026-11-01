"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ListOrdered, Smartphone, XCircle } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { OrderDetailsModal } from "@/components/dashboard/OrderDetailsModal";
import { Pagination } from "@/components/dashboard/Pagination";
import { getOrders } from "@/lib/dashboard/api";
import { cn } from "@/lib/cn";
import type { Order, OrderStatus } from "@/lib/dashboard/types";

const TABS: Array<{ label: string; value: OrderStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const PAGE_SIZE = 5;

export function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<OrderStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => {
    getOrders().then((o) => {
      setOrders(o);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(
    () => (tab === "all" ? orders : orders.filter((o) => o.status === tab)),
    [orders, tab],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function changeTab(value: OrderStatus | "all") {
    setTab(value);
    setPage(1);
  }

  const stats = {
    total: orders.length,
    active: orders.filter((o) => o.status === "active").length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled" || o.status === "failed").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">Orders</h1>
        <p className="mt-1.5 text-navy/60">Review every number you&apos;ve ordered through Bluffy.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={ListOrdered} label="Total Orders" value={String(stats.total)} loading={loading} />
        <StatCard icon={Smartphone} label="Active Orders" value={String(stats.active)} loading={loading} />
        <StatCard icon={CheckCircle2} label="Completed Orders" value={String(stats.completed)} loading={loading} />
        <StatCard icon={XCircle} label="Cancelled Orders" value={String(stats.cancelled)} loading={loading} />
      </div>

      <SectionCard>
        <div className="mb-5 flex gap-1.5 overflow-x-auto rounded-full bg-canvas p-1.5">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => changeTab(t.value)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors",
                tab === t.value ? "bg-primary text-white" : "text-navy/55 hover:text-primary",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <OrdersTable orders={paged} loading={loading} onViewDetails={setSelected} />
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </SectionCard>

      <OrderDetailsModal order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
