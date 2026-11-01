"use client";

import { Sheet } from "@/components/dashboard/profile/Sheet";
import { Badge } from "@/components/dashboard/Badge";
import { Flag } from "@/components/dashboard/Flag";
import { formatDateTime, formatCurrency } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/dashboard/types";

type Row = Order & { userName: string };

const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ["active", "cancelled"],
  active: ["completed", "failed", "cancelled"],
  completed: [],
  cancelled: [],
  failed: [],
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
  failed: "Failed",
};

type Props = {
  order: Row | null;
  onClose: () => void;
  onChangeStatus: (order: Row, status: OrderStatus) => void;
};

export function AdminOrderDetailSheet({ order, onClose, onChangeStatus }: Props) {
  return (
    <Sheet open={!!order} onClose={onClose} title="Detail Pesanan" description={order?.id}>
      {order && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-canvas p-4 ring-1 ring-soft/70">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-navy">{order.userName}</p>
              <Badge status={order.status} />
            </div>
            <div className="mt-3 space-y-1.5 text-sm text-navy/60">
              <p>Layanan: <span className="font-semibold text-navy">{order.serviceName}</span></p>
              <p className="inline-flex items-center gap-1.5">
                Negara: <Flag code={order.countryCode} /> <span className="font-semibold text-navy">{order.countryName}</span>
              </p>
              <p>Nomor: <span className="font-mono font-semibold text-navy">{order.phoneNumber}</span></p>
              <p>Harga Jual: <span className="font-semibold text-navy">{formatCurrency(order.price)}</span></p>
              <p>Harga Supplier: <span className="font-semibold text-navy">{formatCurrency(order.supplierPrice)}</span></p>
              <p>Profit: <span className="font-semibold text-emerald-600">{formatCurrency(order.price - order.supplierPrice)}</span></p>
              <p>OTP: <span className="font-mono font-semibold text-navy">{order.otp ?? "—"}</span></p>
            </div>
          </div>

          {NEXT_STATUSES[order.status].length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-navy">Ubah Status</p>
              <div className="flex flex-wrap gap-2">
                {NEXT_STATUSES[order.status].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onChangeStatus(order, s)}
                    className="rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/20"
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-semibold text-navy">Riwayat Status</p>
            <div className="space-y-2">
              {order.statusHistory.map((h, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-canvas px-3 py-2 text-sm">
                  <span className="font-semibold text-navy">{STATUS_LABELS[h.status]}</span>
                  <span className="text-xs text-navy/50">{formatDateTime(h.at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
