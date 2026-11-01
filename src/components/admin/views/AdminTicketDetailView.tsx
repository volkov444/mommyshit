"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { useToast } from "@/components/dashboard/ToastProvider";
import { getTicketById, replyToTicket, setTicketStatus } from "@/lib/admin/ticketsStore";
import { formatDateTime } from "@/lib/format";
import type { SupportTicket, TicketStatus } from "@/lib/admin/types";

export function AdminTicketDetailView({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [ticket, setTicket] = useState<SupportTicket | null | undefined>(undefined);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getTicketById(ticketId).then((t) => setTicket(t ?? null));
  }, [ticketId]);

  if (ticket === undefined) return null;

  if (ticket === null) {
    return (
      <SectionCard>
        <p className="text-sm text-navy/60">Tiket tidak ditemukan.</p>
      </SectionCard>
    );
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    const updated = await replyToTicket(ticketId, message.trim());
    if (!updated) return;
    setTicket(updated);
    setMessage("");
    toast("Balasan terkirim.", "success");
  }

  async function handleStatusChange(status: TicketStatus) {
    const updated = await setTicketStatus(ticketId, status);
    if (!updated) return;
    setTicket(updated);
    toast("Status tiket diperbarui.", "success");
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push("/admin/support")}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-deep"
      >
        <ArrowLeft size={15} />
        Kembali ke Customer Service
      </button>

      <SectionCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-navy">{ticket.subject}</h1>
            <p className="mt-1 text-sm text-navy/60">
              {ticket.userName} · {formatDateTime(ticket.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AdminBadge status={ticket.status} />
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
              className="rounded-full bg-canvas px-3 py-1.5 text-xs font-bold text-navy ring-1 ring-soft focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-2xl bg-canvas p-4 ring-1 ring-soft/70">
            <p className="text-xs font-bold text-navy/50">{ticket.userName}</p>
            <p className="mt-1 text-sm text-navy">{ticket.message}</p>
          </div>
          {ticket.replies.map((r, i) => (
            <div
              key={i}
              className={`rounded-2xl p-4 ring-1 ${r.author === "admin" ? "ml-6 bg-primary/10 ring-primary/20" : "mr-6 bg-canvas ring-soft/70"}`}
            >
              <p className="text-xs font-bold text-navy/50">{r.author === "admin" ? "Bluffy Admin" : ticket.userName}</p>
              <p className="mt-1 text-sm text-navy">{r.message}</p>
              <p className="mt-1 text-xs text-navy/40">{formatDateTime(r.at)}</p>
            </div>
          ))}
        </div>

        <form className="mt-5 flex gap-2" onSubmit={handleReply}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tulis balasan..."
            className="flex-1 rounded-full bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgb(40_117_251/0.6)] transition-opacity hover:opacity-90"
          >
            <Send size={14} />
            Kirim
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
