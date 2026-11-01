"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Sheet } from "@/components/dashboard/profile/Sheet";
import type { Supplier } from "@/lib/admin/types";

type Props = {
  open: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onSubmit: (values: { name: string; apiUrl: string; apiKey: string; active: boolean }) => void;
};

export function AdminSupplierFormSheet({ open, onClose, supplier, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [active, setActive] = useState(true);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the form fields when the sheet opens for a different supplier, not a render-triggered sync
    setName(supplier?.name ?? "");
    setApiUrl(supplier?.apiUrl ?? "");
    setApiKey(supplier?.apiKey ?? "");
    setActive(supplier?.active ?? true);
  }, [open, supplier]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), apiUrl: apiUrl.trim(), apiKey: apiKey.trim(), active });
  }

  return (
    <Sheet open={open} onClose={onClose} title={supplier ? "Edit Supplier" : "Tambah Supplier"} description="Tombol &quot;Test Koneksi&quot; pada daftar supplier memanggil API ini secara nyata untuk memeriksa saldo/kunci API. Pembelian nomor pengguna tetap berjalan dalam mode demo.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="supplier-name" className="mb-1.5 block text-sm font-semibold text-navy">
            Nama Supplier
          </label>
          <input
            id="supplier-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="5sim"
            className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label htmlFor="supplier-url" className="mb-1.5 block text-sm font-semibold text-navy">
            API URL
          </label>
          <input
            id="supplier-url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://vak-sms.com"
            className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label htmlFor="supplier-key" className="mb-1.5 block text-sm font-semibold text-navy">
            API Key
          </label>
          <div className="relative">
            <input
              id="supplier-key"
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Masukkan kunci API supplier"
              autoComplete="off"
              className="w-full rounded-xl bg-canvas px-4 py-2.5 pr-11 text-sm font-mono text-navy ring-1 ring-soft placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              aria-label={showKey ? "Sembunyikan kunci API" : "Tampilkan kunci API"}
              className="absolute inset-y-0 right-2 grid w-8 place-items-center text-navy/40 hover:text-navy"
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <label className="flex items-center gap-2.5 text-sm font-semibold text-navy">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-primary" />
          Aktif
        </label>

        <button
          type="submit"
          className="w-full rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgb(40_117_251/0.6)] transition-opacity hover:opacity-90"
        >
          {supplier ? "Simpan Perubahan" : "Tambah Supplier"}
        </button>
      </form>
    </Sheet>
  );
}
