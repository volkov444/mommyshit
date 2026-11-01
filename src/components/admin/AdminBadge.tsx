import { cn } from "@/lib/cn";
import type { AdminStatus } from "@/lib/admin/types";

const STYLES: Record<AdminStatus, string> = {
  pending: "bg-amber-50 text-amber-600",
  success: "bg-emerald-50 text-emerald-600",
  failed: "bg-red-50 text-red-500",
  expired: "bg-navy/10 text-navy/60",
  open: "bg-amber-50 text-amber-600",
  in_progress: "bg-primary/10 text-primary",
  resolved: "bg-emerald-50 text-emerald-600",
  active: "bg-emerald-50 text-emerald-600",
  blocked: "bg-red-50 text-red-500",
  inactive: "bg-navy/10 text-navy/60",
  connected: "bg-emerald-50 text-emerald-600",
  disconnected: "bg-navy/10 text-navy/60",
};

const LABELS: Record<AdminStatus, string> = {
  pending: "Pending",
  success: "Berhasil",
  failed: "Gagal",
  expired: "Kedaluwarsa",
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  active: "Aktif",
  blocked: "Diblokir",
  inactive: "Tidak Aktif",
  connected: "Terhubung",
  disconnected: "Tidak Terhubung",
};

export function AdminBadge({ status }: { status: AdminStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", STYLES[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[status]}
    </span>
  );
}
