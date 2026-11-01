import { cn } from "@/lib/cn";
import type { OrderStatus, TransactionStatus } from "@/lib/dashboard/types";

type Status = OrderStatus | TransactionStatus;

const STYLES: Record<Status, string> = {
  active: "bg-primary/10 text-primary",
  completed: "bg-emerald-50 text-emerald-600",
  pending: "bg-amber-50 text-amber-600",
  cancelled: "bg-navy/10 text-navy/60",
  failed: "bg-red-50 text-red-500",
};

const LABELS: Record<Status, string> = {
  active: "Active",
  completed: "Completed",
  pending: "Pending",
  cancelled: "Cancelled",
  failed: "Failed",
};

export function Badge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
        STYLES[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[status]}
    </span>
  );
}
