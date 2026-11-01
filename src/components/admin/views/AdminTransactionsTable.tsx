import { AdminBadge } from "@/components/admin/AdminBadge";
import { Skeleton } from "@/components/dashboard/Skeleton";
import { formatDateTime, formatCurrency } from "@/lib/format";
import type { Transaction } from "@/lib/dashboard/types";

type Row = Transaction & { userName: string };

const TYPE_LABELS: Record<Transaction["type"], string> = {
  deposit: "Deposit",
  purchase: "Pembelian Nomor",
  refund: "Refund",
  adjustment: "Penyesuaian Saldo",
};

function statusKey(status: Transaction["status"]): "pending" | "success" | "failed" {
  if (status === "completed") return "success";
  return status;
}

type Props = {
  transactions: Row[];
  loading?: boolean;
};

export function AdminTransactionsTable({ transactions, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return <p className="py-8 text-center text-sm text-navy/50">Tidak ada transaksi ditemukan.</p>;
  }

  return (
    <>
      <table className="hidden w-full text-left text-sm sm:table">
        <thead>
          <tr className="text-xs font-bold uppercase tracking-wider text-navy/40">
            <th className="pb-3 font-bold">Transaction ID</th>
            <th className="pb-3 font-bold">User</th>
            <th className="pb-3 font-bold">Tipe</th>
            <th className="pb-3 font-bold">Nominal</th>
            <th className="pb-3 font-bold">Status</th>
            <th className="pb-3 font-bold">Tanggal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-soft/70">
          {transactions.map((t) => (
            <tr key={t.id}>
              <td className="py-3.5 font-mono text-xs font-semibold text-navy/60">{t.id}</td>
              <td className="py-3.5 font-semibold text-navy">{t.userName}</td>
              <td className="py-3.5 text-navy/70">{TYPE_LABELS[t.type]}</td>
              <td className={`py-3.5 font-bold ${t.amount >= 0 ? "text-emerald-600" : "text-navy"}`}>
                {t.amount >= 0 ? "+" : ""}{formatCurrency(t.amount)}
              </td>
              <td className="py-3.5">
                <AdminBadge status={statusKey(t.status)} />
              </td>
              <td className="py-3.5 text-navy/55">{formatDateTime(t.date)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-3 sm:hidden">
        {transactions.map((t) => (
          <div key={t.id} className="rounded-2xl bg-canvas p-4 ring-1 ring-soft/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-navy">{t.userName}</p>
                <p className="mt-0.5 text-xs text-navy/50">{TYPE_LABELS[t.type]}</p>
              </div>
              <AdminBadge status={statusKey(t.status)} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-navy/50">
              <span>{formatDateTime(t.date)}</span>
              <span className={`font-bold ${t.amount >= 0 ? "text-emerald-600" : "text-navy"}`}>
                {t.amount >= 0 ? "+" : ""}{formatCurrency(t.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
