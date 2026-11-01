"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/dashboard/profile/Sheet";
import { formatCurrency } from "@/lib/format";
import type { Service } from "@/lib/dashboard/types";
import type { AdminPriceTier } from "@/lib/admin/types";

type Props = {
  open: boolean;
  onClose: () => void;
  tier: AdminPriceTier | null;
  services: Service[];
  countryCode: string;
  onSubmit: (values: { serviceId: string; supplierPrice: number; sellPrice: number; stock: number; active: boolean }) => void;
};

export function AdminPriceTierFormSheet({ open, onClose, tier, services, countryCode, onSubmit }: Props) {
  const [serviceId, setServiceId] = useState("");
  const [supplierPrice, setSupplierPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [stock, setStock] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the form fields when the sheet opens for a different tier, not a render-triggered sync
    setServiceId(tier?.serviceId ?? services[0]?.id ?? "");
    setSupplierPrice(tier ? String(tier.supplierPrice) : "");
    setSellPrice(tier ? String(tier.sellPrice) : "");
    setStock(tier ? String(tier.stock) : "");
    setActive(tier?.active ?? true);
  }, [open, tier, services]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supplier = Number(supplierPrice);
    const sell = Number(sellPrice);
    const stockValue = Number(stock);
    if (!serviceId || !supplier || !sell || stockValue < 0) return;
    onSubmit({ serviceId, supplierPrice: supplier, sellPrice: sell, stock: stockValue, active });
  }

  const profit = Number(sellPrice || 0) - Number(supplierPrice || 0);

  return (
    <Sheet open={open} onClose={onClose} title={tier ? "Edit Tier Harga" : "Tambah Tier Harga"} description={countryCode}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="tier-service" className="mb-1.5 block text-sm font-semibold text-navy">
            Layanan
          </label>
          <select
            id="tier-service"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            disabled={!!tier}
            className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="tier-supplier" className="mb-1.5 block text-sm font-semibold text-navy">
              Harga Supplier
            </label>
            <input
              id="tier-supplier"
              type="number"
              min={0.01}
              step="0.01"
              value={supplierPrice}
              onChange={(e) => setSupplierPrice(e.target.value)}
              placeholder="0.06"
              className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label htmlFor="tier-sell" className="mb-1.5 block text-sm font-semibold text-navy">
              Harga Jual
            </label>
            <input
              id="tier-sell"
              type="number"
              min={0.01}
              step="0.01"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="0.1"
              className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <p className="text-xs font-semibold text-navy/50">
          Profit: <span className={profit >= 0 ? "text-emerald-600" : "text-red-500"}>{formatCurrency(profit)}</span>
        </p>

        <div>
          <label htmlFor="tier-stock" className="mb-1.5 block text-sm font-semibold text-navy">
            Stok
          </label>
          <input
            id="tier-stock"
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="1000"
            className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <label className="flex items-center gap-2.5 text-sm font-semibold text-navy">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-primary" />
          Aktif
        </label>

        <button
          type="submit"
          className="w-full rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgb(40_117_251/0.6)] transition-opacity hover:opacity-90"
        >
          {tier ? "Simpan Perubahan" : "Tambah Tier"}
        </button>
      </form>
    </Sheet>
  );
}
