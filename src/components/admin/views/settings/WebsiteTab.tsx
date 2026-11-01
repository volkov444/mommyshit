"use client";

import { useState } from "react";
import { useToast } from "@/components/dashboard/ToastProvider";
import type { WebsiteSettings } from "@/lib/admin/siteSettingsStore";

export type { WebsiteSettings };

type Props = {
  value: WebsiteSettings;
  onSave: (value: WebsiteSettings) => Promise<boolean>;
};

export function WebsiteTab({ value, onSave }: Props) {
  const toast = useToast();
  const [form, setForm] = useState(value);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const ok = await onSave(form);
    setSaving(false);
    toast(ok ? "Pengaturan website tersimpan." : "Gagal menyimpan pengaturan website.", ok ? "success" : "error");
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="settings-headline" className="mb-1.5 block text-sm font-semibold text-navy">
          Headline Landing Page
        </label>
        <input
          id="settings-headline"
          value={form.landingHeadline}
          onChange={(e) => setForm({ ...form, landingHeadline: e.target.value })}
          className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="settings-contact-email" className="mb-1.5 block text-sm font-semibold text-navy">
            Email Kontak
          </label>
          <input
            id="settings-contact-email"
            type="email"
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label htmlFor="settings-contact-phone" className="mb-1.5 block text-sm font-semibold text-navy">
            Telepon Kontak
          </label>
          <input
            id="settings-contact-phone"
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>
      <div>
        <label htmlFor="settings-support-hours" className="mb-1.5 block text-sm font-semibold text-navy">
          Jam Operasional Customer Service
        </label>
        <input
          id="settings-support-hours"
          value={form.supportHours}
          onChange={(e) => setForm({ ...form, supportHours: e.target.value })}
          placeholder="Senin–Minggu, 08.00–22.00 WIB"
          className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-primary/40"
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
