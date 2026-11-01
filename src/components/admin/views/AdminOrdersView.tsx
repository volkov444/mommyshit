"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Pagination } from "@/components/dashboard/Pagination";
import { useToast } from "@/components/dashboard/ToastProvider";
import { AdminOrdersTable } from "./AdminOrdersTable";
import { AdminOrderDetailSheet } from "./AdminOrderDetailSheet";
import { getAllOrders, updateOrderStatus } from "@/lib/admin/ordersStore";
import { getUsers } from "@/lib/admin/usersStore";
import { getServices } from "@/lib/admin/servicesStore";
import { getCountries } from "@/lib/admin/countriesStore";
import { logActivity } from "@/lib/admin/activityLogStore";
import { getSession } from "@/lib/admin/session";
import type { Order, OrderStatus, Service, Country } from "@/lib/dashboard/types";

const PAGE_SIZE = 10;
type Row = Order & { userName: string };
type StatusFilter = "all" | OrderStatus;

export function AdminOrdersView() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [query, setQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Row | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);

  function reload() {
    Promise.all([getUsers(), getAllOrders()]).then(([allUsers, orders]) => {
      const usersById = new Map(allUsers.map((u) => [u.id, u.name]));
      setRows(orders.map((o) => ({ ...o, userName: usersById.get(o.userId) ?? o.userId })));
    });
  }

  useEffect(() => {
    reload();
    getServices().then(setServices);
    getCountries().then(setCountries);
    const q = new URLSearchParams(window.location.search).get("q");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the ?q= query param present on mount, not a render-triggered sync
    if (q) setQuery(q);
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    return rows
      .filter((o) => serviceFilter === "all" || o.serviceId === serviceFilter)
      .filter((o) => countryFilter === "all" || o.countryCode === countryFilter)
      .filter((o) => statusFilter === "all" || o.status === statusFilter)
      .filter((o) => !q || o.id.toLowerCase().includes(q) || o.userName.toLowerCase().includes(q) || o.phoneNumber.toLowerCase().includes(q));
  }, [rows, query, serviceFilter, countryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleChangeStatus(order: Row, status: OrderStatus) {
    const ok = await updateOrderStatus(order.id, status);
    if (!ok) return;
    const session = getSession();
    logActivity({
      actorId: session.userId,
      actorName: "Bluffy Admin",
      action: `Mengubah status pesanan ${order.id} menjadi ${status}`,
      targetType: "order",
      targetId: order.id,
    });
    reload();
    setSelected(null);
    toast(`Status pesanan ${order.id} diperbarui.`, "success");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">Manajemen Pesanan</h1>
        <p className="mt-1.5 text-navy/60">Pantau seluruh pesanan nomor virtual dari pengguna.</p>
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
              placeholder="Cari order ID, user, nomor..."
              className="w-full rounded-full bg-canvas py-2.5 pl-9 pr-4 text-sm text-navy ring-1 ring-soft placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={serviceFilter}
              onChange={(e) => {
                setServiceFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-full bg-canvas px-4 py-2.5 text-xs font-bold text-navy ring-1 ring-soft focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">Semua Layanan</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={countryFilter}
              onChange={(e) => {
                setCountryFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-full bg-canvas px-4 py-2.5 text-xs font-bold text-navy ring-1 ring-soft focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">Semua Negara</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
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
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="mt-5">
          <AdminOrdersTable orders={pageRows} loading={!rows} onViewDetails={setSelected} />
        </div>

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </SectionCard>

      <AdminOrderDetailSheet order={selected} onClose={() => setSelected(null)} onChangeStatus={handleChangeStatus} />
    </div>
  );
}
