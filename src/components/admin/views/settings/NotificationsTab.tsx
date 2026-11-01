"use client";

import { useState } from "react";
import { useToast } from "@/components/dashboard/ToastProvider";
import type { NotificationSettings } from "@/lib/admin/siteSettingsStore";

export type { NotificationSettings };

type Props = {
  value: NotificationSettings;
  onSave: (value: NotificationSettings) => Promise<boolean>;
};

const ITEMS: { key: keyof NotificationSettings; label: string; description: string }[] = [
  { key: "newDeposit", label: "Deposit Baru", description: "Notifikasi saat ada permintaan deposit baru." },
  { key: "newOrder", label: "Pesanan Baru", description: "Notifikasi saat ada pesanan nomor baru." },
  { key: "newTicket", label: "Tiket Baru", description: "Notifikasi saat ada tiket customer service baru." },
  { key: "lowStock", label: "Stok Menipis", description: "Notifikasi saat stok nomor di suatu negara menipis." },
];

export function NotificationsTab({ value, onSave }: Props) {
  const toast = useToast();
  const [form, setForm] = useState(value);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const ok = await onSave(form);
    setSaving(false);
    toast(ok ? "Preferensi notifikasi tersimpan." : "Gagal menyimpan preferensi notifikasi.", ok ? "success" : "error");
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {ITEMS.map((item) => (
        <label key={item.key} className="flex items-center justify-between gap-4 rounded-2xl bg-canvas p-4 ring-1 ring-soft/70">
          <div>
            <p className="text-sm font-bold text-navy">{item.label}</p>
            <p className="text-xs text-navy/50">{item.description}</p>
          </div>
          <input
            type="checkbox"
            checked={form[item.key]}
            onChange={(e) => setForm({ ...form, [item.key]: e.target.checked })}
            className="h-5 w-5 shrink-0 accent-primary"
          />
        </label>
      ))}
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgb(40_117_251/0.6)] transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
