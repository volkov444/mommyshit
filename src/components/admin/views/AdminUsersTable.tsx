import Link from "next/link";
import { Eye } from "lucide-react";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { Skeleton } from "@/components/dashboard/Skeleton";
import { formatDate, formatCurrency, formatNumber } from "@/lib/format";
import type { User } from "@/lib/dashboard/types";

type Row = User & { orderCount: number };

type Props = {
  users: Row[];
  loading?: boolean;
};

export function AdminUsersTable({ users, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return <p className="py-8 text-center text-sm text-navy/50">Tidak ada pengguna ditemukan.</p>;
  }

  return (
    <>
      <table className="hidden w-full text-left text-sm sm:table">
        <thead>
          <tr className="text-xs font-bold uppercase tracking-wider text-navy/40">
            <th className="pb-3 font-bold">User ID</th>
            <th className="pb-3 font-bold">Nama</th>
            <th className="pb-3 font-bold">Email</th>
            <th className="pb-3 font-bold">Saldo</th>
            <th className="pb-3 font-bold">Total Pesanan</th>
            <th className="pb-3 font-bold">Status</th>
            <th className="pb-3 font-bold">Tanggal Bergabung</th>
            <th className="pb-3 font-bold" />
          </tr>
        </thead>
        <tbody className="divide-y divide-soft/70">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="py-3.5 font-mono text-xs font-semibold text-navy/60">{u.id}</td>
              <td className="py-3.5 font-semibold text-navy">{u.name}</td>
              <td className="py-3.5 text-navy/70">{u.email}</td>
              <td className="py-3.5 font-bold text-navy">{formatCurrency(u.balance)}</td>
              <td className="py-3.5 text-navy/70">{formatNumber(u.orderCount)}</td>
              <td className="py-3.5">
                <AdminBadge status={u.status} />
              </td>
              <td className="py-3.5 text-navy/55">{formatDate(u.joinedAt)}</td>
              <td className="py-3.5 text-right">
                <Link
                  href={`/admin/users/${u.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-xs font-bold text-navy ring-1 ring-soft transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <Eye size={13} />
                  Lihat
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-3 sm:hidden">
        {users.map((u) => (
          <div key={u.id} className="rounded-2xl bg-canvas p-4 ring-1 ring-soft/70">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-navy">{u.name}</p>
                <p className="truncate text-xs text-navy/50">{u.email}</p>
              </div>
              <AdminBadge status={u.status} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-navy/50">
              <span>{formatDate(u.joinedAt)}</span>
              <span className="font-bold text-navy">{formatCurrency(u.balance)}</span>
            </div>
            <Link
              href={`/admin/users/${u.id}`}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-bold text-navy ring-1 ring-soft"
            >
              <Eye size={13} />
              Lihat Detail
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
