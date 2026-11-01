"use client";

import { useState } from "react";
import { useToast } from "@/components/dashboard/ToastProvider";
import type { GeneralSettings } from "@/lib/admin/siteSettingsStore";

export type { GeneralSettings };

type Props = {
  value: GeneralSettings;
  onSave: (value: GeneralSettings) => Promise<boolean>;
};

export function GeneralTab({ value, onSave }: Props) {
  const toast = useToast();
  const [form, setForm] = useState(value);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const ok = await onSave(form);
    setSaving(false);
    toast(ok ? "Pengaturan umum tersimpan." : "Gagal menyimpan pengaturan umum.", ok ? "success" : "error");
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="settings-site-name" className="mb-1.5 block text-sm font-semibold text-navy">
          Nama Situs
        </label>
        <input
          id="settings-site-name"
          value={form.siteName}
          onChange={(e) => setForm({ ...form, siteName: e.target.value })}
          className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <div>
        <label htmlFor="settings-logo" className="mb-1.5 block text-sm font-semibold text-navy">
          URL Logo
        </label>
        <input
          id="settings-logo"
          value={form.logoUrl}
          onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
          placeholder="/logo.svg"
          className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <div>
        <label htmlFor="settings-description" className="mb-1.5 block text-sm font-semibold text-navy">
          Deskripsi Situs
        </label>
        <textarea
          id="settings-description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
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
