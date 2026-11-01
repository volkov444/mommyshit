"use client";

import { useState } from "react";
import { Sheet } from "@/components/dashboard/profile/Sheet";
import { useToast } from "@/components/dashboard/ToastProvider";
import { adjustUserBalance } from "@/lib/admin/usersStore";
import { getSession } from "@/lib/admin/session";
import { formatCurrency } from "@/lib/format";
import type { User } from "@/lib/dashboard/types";

type Props = {
  open: boolean;
  onClose: () => void;
  user: User;
  onAdjusted: (updated: User) => void;
};

export function AdminBalanceAdjustSheet({ open, onClose, user, onAdjusted }: Props) {
  const toast = useToast();
  const [mode, setMode] = useState<"add" | "subtract">("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setMode("add");
    setAmount("");
    setReason("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      toast("Masukkan nominal yang valid.", "error");
      return;
    }
    if (!reason.trim()) {
      toast("Alasan penyesuaian saldo wajib diisi.", "error");
      return;
    }

    setSubmitting(true);
    const session = getSession();
    const delta = mode === "add" ? value : -value;
    const updated = await adjustUserBalance(user.id, delta, reason.trim(), session.userId);
    setSubmitting(false);

    if (!updated) {
      toast("Gagal menyesuaikan saldo.", "error");
      return;
    }

    onAdjusted(updated);
    toast(`Saldo ${user.name} berhasil ${mode === "add" ? "ditambah" : "dikurangi"} ${formatCurrency(value)}.`, "success");
    reset();
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Sesuaikan Saldo" description={`Saldo saat ini: ${formatCurrency(user.balance)}`}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("add")}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              mode === "add" ? "bg-primary text-white" : "bg-canvas text-navy/60 ring-1 ring-soft"
            }`}
          >
            Tambah Saldo
          </button>
          <button
            type="button"
            onClick={() => setMode("subtract")}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              mode === "subtract" ? "bg-primary text-white" : "bg-canvas text-navy/60 ring-1 ring-soft"
            }`}
          >
            Kurangi Saldo
          </button>
        </div>

        <div>
          <label htmlFor="adjust-amount" className="mb-1.5 block text-sm font-semibold text-navy">
            Nominal ($)
          </label>
          <input
            id="adjust-amount"
            type="number"
            min={0.01}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10"
            className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label htmlFor="adjust-reason" className="mb-1.5 block text-sm font-semibold text-navy">
            Alasan
          </label>
          <textarea
            id="adjust-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Contoh: Kompensasi gangguan layanan"
            rows={3}
            className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgb(40_117_251/0.6)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>
    </Sheet>
  );
}
