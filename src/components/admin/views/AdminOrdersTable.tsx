import { Eye } from "lucide-react";
import { Badge } from "@/components/dashboard/Badge";
import { Flag } from "@/components/dashboard/Flag";
import { Skeleton } from "@/components/dashboard/Skeleton";
import { formatDateTime, formatCurrency } from "@/lib/format";
import type { Order } from "@/lib/dashboard/types";

type Row = Order & { userName: string };

type Props = {
  orders: Row[];
  loading?: boolean;
  onViewDetails: (order: Row) => void;
};

export function AdminOrdersTable({ orders, loading, onViewDetails }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return <p className="py-8 text-center text-sm text-navy/50">Tidak ada pesanan ditemukan.</p>;
  }

  return (
    <>
      <table className="hidden w-full text-left text-sm sm:table">
        <thead>
          <tr className="text-xs font-bold uppercase tracking-wider text-navy/40">
            <th className="pb-3 font-bold">Order ID</th>
            <th className="pb-3 font-bold">User</th>
            <th className="pb-3 font-bold">Layanan</th>
            <th className="pb-3 font-bold">Negara</th>
            <th className="pb-3 font-bold">Harga Jual</th>
            <th className="pb-3 font-bold">Profit</th>
            <th className="pb-3 font-bold">Status</th>
            <th className="pb-3 font-bold">Tanggal</th>
            <th className="pb-3 font-bold" />
          </tr>
        </thead>
        <tbody className="divide-y divide-soft/70">
          {orders.map((o) => (
            <tr key={o.id}>
              <td className="py-3.5 font-mono text-xs font-semibold text-navy/60">{o.id}</td>
              <td className="py-3.5 font-semibold text-navy">{o.userName}</td>
              <td className="py-3.5 text-navy/70">{o.serviceName}</td>
              <td className="py-3.5 text-navy/70">
                <span className="inline-flex items-center gap-1.5">
                  <Flag code={o.countryCode} />
                  {o.countryName}
                </span>
              </td>
              <td className="py-3.5 font-bold text-navy">{formatCurrency(o.price)}</td>
              <td className="py-3.5 font-semibold text-emerald-600">{formatCurrency(o.price - o.supplierPrice)}</td>
              <td className="py-3.5">
                <Badge status={o.status} />
              </td>
              <td className="py-3.5 text-navy/55">{formatDateTime(o.createdAt)}</td>
              <td className="py-3.5 text-right">
                <button
                  type="button"
                  onClick={() => onViewDetails(o)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-xs font-bold text-navy ring-1 ring-soft transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <Eye size={13} />
                  Lihat
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-3 sm:hidden">
        {orders.map((o) => (
          <div key={o.id} className="rounded-2xl bg-canvas p-4 ring-1 ring-soft/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-navy">{o.serviceName}</p>
                <p className="mt-0.5 text-xs text-navy/50">{o.userName}</p>
              </div>
              <Badge status={o.status} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-navy/50">
              <span className="inline-flex items-center gap-1.5">
                <Flag code={o.countryCode} />
                {formatDateTime(o.createdAt)}
              </span>
              <span className="font-bold text-navy">{formatCurrency(o.price)}</span>
            </div>
            <button
              type="button"
              onClick={() => onViewDetails(o)}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-bold text-navy ring-1 ring-soft"
            >
              <Eye size={13} />
              Lihat Detail
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
