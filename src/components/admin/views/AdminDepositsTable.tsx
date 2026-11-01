import { Eye } from "lucide-react";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { Skeleton } from "@/components/dashboard/Skeleton";
import { formatDateTime, formatCurrency } from "@/lib/format";
import type { Deposit } from "@/lib/admin/types";

type Row = Deposit & { userName: string; methodLabel: string };

type Props = {
  deposits: Row[];
  loading?: boolean;
  onViewDetails: (deposit: Row) => void;
};

export function AdminDepositsTable({ deposits, loading, onViewDetails }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (deposits.length === 0) {
    return <p className="py-8 text-center text-sm text-navy/50">Tidak ada deposit ditemukan.</p>;
  }

  return (
    <>
      <table className="hidden w-full text-left text-sm sm:table">
        <thead>
          <tr className="text-xs font-bold uppercase tracking-wider text-navy/40">
            <th className="pb-3 font-bold">Deposit ID</th>
            <th className="pb-3 font-bold">User</th>
            <th className="pb-3 font-bold">Nominal</th>
            <th className="pb-3 font-bold">Metode Pembayaran</th>
            <th className="pb-3 font-bold">Status</th>
            <th className="pb-3 font-bold">Tanggal</th>
            <th className="pb-3 font-bold" />
          </tr>
        </thead>
        <tbody className="divide-y divide-soft/70">
          {deposits.map((d) => (
            <tr key={d.id}>
              <td className="py-3.5 font-mono text-xs font-semibold text-navy/60">{d.id}</td>
              <td className="py-3.5 font-semibold text-navy">{d.userName}</td>
              <td className="py-3.5 font-bold text-navy">{formatCurrency(d.amount)}</td>
              <td className="py-3.5 text-navy/70">{d.methodLabel}</td>
              <td className="py-3.5">
                <AdminBadge status={d.status} />
              </td>
              <td className="py-3.5 text-navy/55">{formatDateTime(d.createdAt)}</td>
              <td className="py-3.5 text-right">
                <button
                  type="button"
                  onClick={() => onViewDetails(d)}
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
        {deposits.map((d) => (
          <div key={d.id} className="rounded-2xl bg-canvas p-4 ring-1 ring-soft/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-navy">{d.userName}</p>
                <p className="mt-0.5 text-xs text-navy/50">{d.methodLabel}</p>
              </div>
              <AdminBadge status={d.status} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-navy/50">
              <span>{formatDateTime(d.createdAt)}</span>
              <span className="font-bold text-navy">{formatCurrency(d.amount)}</span>
            </div>
            <button
              type="button"
              onClick={() => onViewDetails(d)}
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
