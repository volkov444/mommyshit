import type { LucideIcon } from "lucide-react";
import { Skeleton } from "./Skeleton";

type Props = {
  icon: LucideIcon;
  label: string;
  value: string;
  loading?: boolean;
};

export function StatCard({ icon: Icon, label, value, loading }: Props) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-soft">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon size={20} />
      </span>
      <p className="mt-4 text-sm font-semibold text-navy/55">{label}</p>
      {loading ? (
        <Skeleton className="mt-1.5 h-7 w-20" />
      ) : (
        <p className="mt-1 text-2xl font-extrabold tracking-tight text-navy">{value}</p>
      )}
    </div>
  );
}
