"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Sheet } from "@/components/dashboard/profile/Sheet";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { formatDateTime, formatCurrency } from "@/lib/format";
import type { Deposit } from "@/lib/admin/types";

type Row = Deposit & { userName: string; methodLabel: string };

type Props = {
  deposit: Row | null;
  onClose: () => void;
  onApprove: (deposit: Row) => void;
  onReject: (deposit: Row) => void;
};

export function AdminDepositDetailSheet({ deposit, onClose, onApprove, onReject }: Props) {
  return (
    <Sheet open={!!deposit} onClose={onClose} title="Detail Deposit" description={deposit?.id}>
      {deposit && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-canvas p-4 ring-1 ring-soft/70">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-navy">{deposit.userName}</p>
              <AdminBadge status={deposit.status} />
            </div>
            <p className="mt-3 text-2xl font-extrabold text-navy">{formatCurrency(deposit.amount)}</p>
            <div className="mt-3 space-y-1.5 text-sm text-navy/60">
              <p>Metode: <span className="font-semibold text-navy">{deposit.methodLabel}</span></p>
              <p>Tanggal: <span className="font-semibold text-navy">{formatDateTime(deposit.createdAt)}</span></p>
            </div>
          </div>

          {deposit.status === "pending" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onApprove(deposit)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgb(40_117_251/0.6)] transition-opacity hover:opacity-90"
              >
                <CheckCircle2 size={15} />
                Setujui
              </button>
              <button
                type="button"
                onClick={() => onReject(deposit)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-red-50 px-4 py-3 text-sm font-bold text-red-500 ring-1 ring-red-100 transition-colors hover:bg-red-100"
              >
                <XCircle size={15} />
                Tolak
              </button>
            </div>
          )}

          {deposit.status !== "pending" && (
            <p className="text-center text-xs text-navy/45">Deposit ini sudah diproses dan tidak dapat diubah lagi.</p>
          )}
        </div>
      )}
    </Sheet>
  );
}
