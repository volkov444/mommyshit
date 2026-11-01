"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Skeleton } from "@/components/dashboard/Skeleton";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { getTickets } from "@/lib/admin/ticketsStore";
import { formatDateTime } from "@/lib/format";
import type { SupportTicket } from "@/lib/admin/types";

export function AdminSupportView() {
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);

  useEffect(() => {
    getTickets().then(setTickets);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">Customer Service</h1>
        <p className="mt-1.5 text-navy/60">Kelola tiket bantuan dan pertanyaan dari pengguna.</p>
      </div>

      <SectionCard>
        {!tickets ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <p className="py-8 text-center text-sm text-navy/50">Belum ada tiket.</p>
        ) : (
          <>
            <table className="hidden w-full text-left text-sm sm:table">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wider text-navy/40">
                  <th className="pb-3 font-bold">Ticket ID</th>
                  <th className="pb-3 font-bold">Nama Pengguna</th>
                  <th className="pb-3 font-bold">Subjek</th>
                  <th className="pb-3 font-bold">Tanggal</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-soft/70">
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td className="py-3.5 font-mono text-xs font-semibold text-navy/60">{t.id}</td>
                    <td className="py-3.5 font-semibold text-navy">{t.userName}</td>
                    <td className="py-3.5 text-navy/70">{t.subject}</td>
                    <td className="py-3.5 text-navy/55">{formatDateTime(t.createdAt)}</td>
                    <td className="py-3.5">
                      <AdminBadge status={t.status} />
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        href={`/admin/support/${t.id}`}
                        className="inline-flex items-center gap-1 rounded-full bg-canvas px-3 py-1.5 text-xs font-bold text-navy ring-1 ring-soft transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        Buka
                        <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-3 sm:hidden">
              {tickets.map((t) => (
                <Link key={t.id} href={`/admin/support/${t.id}`} className="flex items-center gap-3 rounded-2xl bg-canvas p-4 ring-1 ring-soft/70">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-navy">{t.subject}</p>
                    <p className="text-xs text-navy/50">{t.userName} · {formatDateTime(t.createdAt)}</p>
                  </div>
                  <AdminBadge status={t.status} />
                  <ChevronRight size={16} className="text-navy/30" />
                </Link>
              ))}
            </div>
          </>
        )}
      </SectionCard>
    </div>
  );
}
