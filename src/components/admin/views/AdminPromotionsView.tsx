"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Skeleton } from "@/components/dashboard/Skeleton";
import { useToast } from "@/components/dashboard/ToastProvider";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { AdminPromotionFormSheet } from "./AdminPromotionFormSheet";
import { getPromotions, addPromotion, updatePromotion, deletePromotion, getReferralUsages } from "@/lib/admin/promotionsStore";
import { getSession } from "@/lib/admin/session";
import { getUsers } from "@/lib/admin/usersStore";
import { formatDate, formatCurrency } from "@/lib/format";
import type { DiscountType, Promotion, PromotionType } from "@/lib/admin/types";

const TYPE_LABELS: Record<PromotionType, string> = { deposit: "Deposit", coupon: "Kupon" };

export function AdminPromotionsView() {
  const toast = useToast();
  const [promotions, setPromotions] = useState<Promotion[] | null>(null);
  const [referralUsages, setReferralUsages] = useState<Awaited<ReturnType<typeof getReferralUsages>>>([]);
  const [usersById, setUsersById] = useState<Map<string, string>>(new Map());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the localStorage demo store on mount, not a render-triggered sync
    setPromotions(getPromotions());
    getReferralUsages().then(setReferralUsages);
    getUsers().then((allUsers) => setUsersById(new Map(allUsers.map((u) => [u.id, u.name]))));
  }, []);

  function actor() {
    const session = getSession();
    return { actorId: session.userId, actorName: session.name };
  }

  function handleSubmit(values: {
    type: PromotionType;
    code: string;
    description: string;
    discountType: DiscountType;
    discountValue: number;
    active: boolean;
    expiresAt: string | null;
  }) {
    const { actorId, actorName } = actor();
    if (editing) {
      updatePromotion(editing.id, values, actorId, actorName);
      toast(`Promo ${values.code} berhasil diperbarui.`, "success");
    } else {
      addPromotion(values, actorId, actorName);
      toast(`Promo ${values.code} berhasil ditambahkan.`, "success");
    }
    setPromotions(getPromotions());
    setSheetOpen(false);
    setEditing(null);
  }

  function handleDelete(promotion: Promotion) {
    const { actorId, actorName } = actor();
    deletePromotion(promotion.id, actorId, actorName);
    setPromotions(getPromotions());
    toast(`Promo ${promotion.code} dihapus.`, "success");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">Promo & Referral</h1>
          <p className="mt-1.5 text-navy/60">Kelola kode referral, promo deposit, dan kupon diskon.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgb(40_117_251/0.6)] transition-opacity hover:opacity-90"
        >
          <Plus size={15} />
          Tambah Promo
        </button>
      </div>

      <SectionCard title="Daftar Promo">
        {!promotions ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {promotions.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-canvas p-4 ring-1 ring-soft/70">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{TYPE_LABELS[p.type]}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-bold text-navy">{p.code}</p>
                  <p className="truncate text-xs text-navy/50">{p.description}</p>
                </div>
                <p className="text-sm font-semibold text-navy">
                  {p.discountType === "percent" ? `${p.discountValue}%` : formatCurrency(p.discountValue)}
                </p>
                <p className="text-xs text-navy/50">{p.usageCount}x dipakai</p>
                <AdminBadge status={p.active ? "active" : "inactive"} />
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(p);
                      setSheetOpen(true);
                    }}
                    aria-label="Edit"
                    className="grid h-8 w-8 place-items-center rounded-full bg-white text-navy ring-1 ring-soft hover:bg-primary/10 hover:text-primary"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p)}
                    aria-label="Hapus"
                    className="grid h-8 w-8 place-items-center rounded-full bg-white text-red-500 ring-1 ring-soft hover:bg-red-50"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Riwayat Penggunaan Referral">
        {referralUsages.length === 0 ? (
          <p className="py-6 text-center text-sm text-navy/50">Belum ada riwayat referral.</p>
        ) : (
          <div className="space-y-1">
            {referralUsages.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 hover:bg-canvas">
                <div className="min-w-0 text-sm">
                  <span className="font-semibold text-navy">{usersById.get(r.referrerUserId) ?? r.referrerUserId}</span>
                  <span className="text-navy/50"> mengundang </span>
                  <span className="font-semibold text-navy">{usersById.get(r.referredUserId) ?? r.referredUserId}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs font-bold text-emerald-600">+{formatCurrency(r.bonusAmount)}</span>
                  <span className="text-xs text-navy/45">{formatDate(r.date)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <AdminPromotionFormSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        promotion={editing}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
