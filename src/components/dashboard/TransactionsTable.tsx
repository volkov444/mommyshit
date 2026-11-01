import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import { formatDateTime, formatCurrency } from "@/lib/format";
import type { Transaction } from "@/lib/dashboard/types";
import { cn } from "@/lib/cn";

type Props = {
  transactions: Transaction[];
  loading?: boolean;
};

export function TransactionsTable({ transactions, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return <p className="py-8 text-center text-sm text-navy/50">No transactions yet.</p>;
  }

  return (
    <>
      <table className="hidden w-full text-left text-sm sm:table">
        <thead>
          <tr className="text-xs font-bold uppercase tracking-wider text-navy/40">
            <th className="pb-3 font-bold">Transaction ID</th>
            <th className="pb-3 font-bold">Description</th>
            <th className="pb-3 font-bold">Amount</th>
            <th className="pb-3 font-bold">Status</th>
            <th className="pb-3 font-bold">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-soft/70">
          {transactions.map((t) => (
            <tr key={t.id}>
              <td className="py-3.5 font-mono text-xs font-semibold text-navy/60">{t.id}</td>
              <td className="py-3.5 font-medium text-navy">{t.description}</td>
              <td
                className={cn(
                  "py-3.5 font-bold",
                  t.amount >= 0 ? "text-emerald-600" : "text-navy",
                )}
              >
                {t.amount >= 0 ? "+" : ""}
                {formatCurrency(t.amount)}
              </td>
              <td className="py-3.5">
                <Badge status={t.status} />
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
              <div className="flex items-start gap-2.5">
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                    t.amount >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-primary/10 text-primary",
                  )}
                >
                  {t.amount >= 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy">{t.description}</p>
                  <p className="mt-0.5 text-xs text-navy/45">{formatDateTime(t.date)}</p>
                </div>
              </div>
              <p className={cn("shrink-0 text-sm font-bold", t.amount >= 0 ? "text-emerald-600" : "text-navy")}>
                {t.amount >= 0 ? "+" : ""}
                {formatCurrency(t.amount)}
              </p>
            </div>
            <div className="mt-3">
              <Badge status={t.status} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
