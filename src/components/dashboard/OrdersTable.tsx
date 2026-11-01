import { Eye } from "lucide-react";
import { Badge } from "./Badge";
import { Flag } from "./Flag";
import { Skeleton } from "./Skeleton";
import { formatDate, formatCurrency } from "@/lib/format";
import type { Order } from "@/lib/dashboard/types";

type Props = {
  orders: Order[];
  loading?: boolean;
  compact?: boolean;
  onViewDetails?: (order: Order) => void;
};

export function OrdersTable({ orders, loading, compact, onViewDetails }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return <p className="py-8 text-center text-sm text-navy/50">No orders yet.</p>;
  }

  return (
    <>
      <table className="hidden w-full text-left text-sm sm:table">
        <thead>
          <tr className="text-xs font-bold uppercase tracking-wider text-navy/40">
            {!compact && <th className="pb-3 font-bold">Order ID</th>}
            <th className="pb-3 font-bold">Service</th>
            <th className="pb-3 font-bold">Country</th>
            <th className="pb-3 font-bold">Phone Number</th>
            <th className="pb-3 font-bold">Price</th>
            {!compact && <th className="pb-3 font-bold">OTP Code</th>}
            <th className="pb-3 font-bold">Status</th>
            <th className="pb-3 font-bold">Date</th>
            {onViewDetails && <th className="pb-3 font-bold" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-soft/70">
          {orders.map((o) => (
            <tr key={o.id}>
              {!compact && <td className="py-3.5 font-mono text-xs font-semibold text-navy/60">{o.id}</td>}
              <td className="py-3.5 font-semibold text-navy">{o.serviceName}</td>
              <td className="py-3.5 text-navy/70">
                <span className="inline-flex items-center gap-1.5">
                  <Flag code={o.countryCode} />
                  {o.countryName}
                </span>
              </td>
              <td className="py-3.5 font-mono text-navy/70">{o.phoneNumber}</td>
              <td className="py-3.5 font-bold text-navy">{formatCurrency(o.price)}</td>
              {!compact && (
                <td className="py-3.5 font-mono text-navy/70">{o.otp ?? "—"}</td>
              )}
              <td className="py-3.5">
                <Badge status={o.status} />
              </td>
              <td className="py-3.5 text-navy/55">{formatDate(o.createdAt)}</td>
              {onViewDetails && (
                <td className="py-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => onViewDetails(o)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-xs font-bold text-navy ring-1 ring-soft transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <Eye size={13} />
                    View
                  </button>
                </td>
              )}
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
                <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-navy/50">
                  <Flag code={o.countryCode} />
                  {o.countryName}
                </p>
              </div>
              <Badge status={o.status} />
            </div>
            <p className="mt-3 font-mono text-sm text-navy/70">{o.phoneNumber}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-navy/50">
              <span>{formatDate(o.createdAt)}</span>
              <span className="font-bold text-navy">{formatCurrency(o.price)}</span>
            </div>
            {onViewDetails && (
              <button
                type="button"
                onClick={() => onViewDetails(o)}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-bold text-navy ring-1 ring-soft"
              >
                <Eye size={13} />
                View Details
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
