"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/dashboard/profile/Sheet";
import type { DiscountType, Promotion, PromotionType } from "@/lib/admin/types";

type Props = {
  open: boolean;
  onClose: () => void;
  promotion: Promotion | null;
  onSubmit: (values: {
    type: PromotionType;
    code: string;
    description: string;
    discountType: DiscountType;
    discountValue: number;
    active: boolean;
    expiresAt: string | null;
  }) => void;
};

export function AdminPromotionFormSheet({ open, onClose, promotion, onSubmit }: Props) {
  const [type, setType] = useState<PromotionType>("coupon");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [active, setActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the form fields when the sheet opens for a different promotion, not a render-triggered sync
    setType(promotion?.type ?? "coupon");
    setCode(promotion?.code ?? "");
    setDescription(promotion?.description ?? "");
    setDiscountType(promotion?.discountType ?? "percent");
    setDiscountValue(promotion ? String(promotion.discountValue) : "");
    setActive(promotion?.active ?? true);
    setExpiresAt(promotion?.expiresAt?.slice(0, 10) ?? "");
  }, [open, promotion]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(discountValue);
    if (!code.trim() || !value) return;
    onSubmit({
      type,
      code: code.trim().toUpperCase(),
      description: description.trim(),
      discountType,
      discountValue: value,
      active,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    });
  }

  return (
    <Sheet open={open} onClose={onClose} title={promotion ? "Edit Promo" : "Tambah Promo"}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="promo-type" className="mb-1.5 block text-sm font-semibold text-navy">
            Tipe Promo
          </label>
          <select
            id="promo-type"
            value={type}
            onChange={(e) => setType(e.target.value as PromotionType)}
            className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="deposit">Deposit</option>
            <option value="coupon">Kupon Diskon</option>
          </select>
        </div>

        <div>
          <label htmlFor="promo-code" className="mb-1.5 block text-sm font-semibold text-navy">
            Kode Promo
          </label>
          <input
            id="promo-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="WELCOME15"
            className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm font-mono text-navy ring-1 ring-soft placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label htmlFor="promo-description" className="mb-1.5 block text-sm font-semibold text-navy">
            Deskripsi
          </label>
          <input
            id="promo-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="15% off pembelian pertama"
            className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="promo-discount-type" className="mb-1.5 block text-sm font-semibold text-navy">
              Jenis Diskon
            </label>
            <select
              id="promo-discount-type"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as DiscountType)}
              className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="percent">Persen (%)</option>
              <option value="flat">Nominal ($)</option>
            </select>
          </div>
          <div>
            <label htmlFor="promo-discount-value" className="mb-1.5 block text-sm font-semibold text-navy">
              Nilai
            </label>
            <input
              id="promo-discount-value"
              type="number"
              min={discountType === "percent" ? 1 : 0.01}
              step={discountType === "percent" ? 1 : 0.01}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === "percent" ? "15" : "5"}
              className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div>
          <label htmlFor="promo-expires" className="mb-1.5 block text-sm font-semibold text-navy">
            Berlaku Hingga (opsional)
          </label>
          <input
            id="promo-expires"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft focus:outline-none focus:ring-2 focus:ring-primary/40"
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
          {promotion ? "Simpan Perubahan" : "Tambah Promo"}
        </button>
      </form>
    </Sheet>
  );
}
