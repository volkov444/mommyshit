"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Flag } from "@/components/dashboard/Flag";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { useToast } from "@/components/dashboard/ToastProvider";
import { AdminPriceTierFormSheet } from "./AdminPriceTierFormSheet";
import { getPriceTiersForCountry, addPriceTier, updatePriceTier, deletePriceTier, computeProfit } from "@/lib/admin/pricingStore";
import { getServices } from "@/lib/admin/servicesStore";
import { getSession } from "@/lib/admin/session";
import { getCountries } from "@/lib/admin/countriesStore";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { Service, Country } from "@/lib/dashboard/types";
import type { AdminPriceTier } from "@/lib/admin/types";

export function AdminPricingDetailView({ countryCode }: { countryCode: string }) {
  const router = useRouter();
  const toast = useToast();
  const [tiers, setTiers] = useState<AdminPriceTier[] | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [country, setCountry] = useState<Country | undefined>(undefined);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPriceTier | null>(null);

  async function reload() {
    setTiers(await getPriceTiersForCountry(countryCode));
  }

  useEffect(() => {
    getServices().then(setServices);
    getCountries().then((countries) => setCountry(countries.find((c) => c.code === countryCode)));
    getPriceTiersForCountry(countryCode).then(setTiers);
  }, [countryCode]);

  function actor() {
    const session = getSession();
    return { actorId: session.userId, actorName: session.name };
  }

  function serviceName(serviceId: string) {
    return services.find((s) => s.id === serviceId)?.name ?? serviceId;
  }

  async function handleSubmit(values: { serviceId: string; supplierPrice: number; sellPrice: number; stock: number; active: boolean }) {
    const { actorId, actorName } = actor();
    if (editing) {
      await updatePriceTier(editing.id, values, actorId, actorName);
      toast("Tier harga berhasil diperbarui.", "success");
    } else {
      await addPriceTier({ ...values, countryCode, supplierServiceCode: null }, actorId, actorName);
      toast("Tier harga berhasil ditambahkan.", "success");
    }
    await reload();
    setSheetOpen(false);
    setEditing(null);
  }

  async function handleToggleActive(tier: AdminPriceTier) {
    const { actorId, actorName } = actor();
    await updatePriceTier(tier.id, { active: !tier.active }, actorId, actorName);
    await reload();
    toast(`Tier ${serviceName(tier.serviceId)} ${tier.active ? "dinonaktifkan" : "diaktifkan"}. Perubahan langsung terlihat di Buy Number pengguna.`, "info");
  }

  async function handleDelete(tier: AdminPriceTier) {
    const { actorId, actorName } = actor();
    await deletePriceTier(tier.id, actorId, actorName);
    await reload();
    toast("Tier harga dihapus.", "success");
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push("/admin/pricing")}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-deep"
      >
        <ArrowLeft size={15} />
        Kembali ke Negara & Harga
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {country && <Flag code={country.code} className="text-2xl" />}
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{country?.name ?? countryCode}</h1>
            <p className="mt-1 text-navy/60">Kelola harga dan stok untuk negara ini.</p>
          </div>
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
          Tambah Tier
        </button>
      </div>

      <SectionCard>
        {!tiers ? (
          <p className="py-8 text-center text-sm text-navy/50">Memuat...</p>
        ) : tiers.length === 0 ? (
          <p className="py-8 text-center text-sm text-navy/50">Belum ada tier harga untuk negara ini.</p>
        ) : (
          <>
            <table className="hidden w-full text-left text-sm sm:table">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wider text-navy/40">
                  <th className="pb-3 font-bold">Layanan</th>
                  <th className="pb-3 font-bold">Harga Supplier</th>
                  <th className="pb-3 font-bold">Harga Jual</th>
                  <th className="pb-3 font-bold">Profit</th>
                  <th className="pb-3 font-bold">Stok</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-soft/70">
                {tiers.map((t) => (
                  <tr key={t.id}>
                    <td className="py-3.5 font-semibold text-navy">{serviceName(t.serviceId)}</td>
                    <td className="py-3.5 text-navy/70">{formatCurrency(t.supplierPrice)}</td>
                    <td className="py-3.5 font-bold text-navy">{formatCurrency(t.sellPrice)}</td>
                    <td className="py-3.5 font-semibold text-emerald-600">{formatCurrency(computeProfit(t))}</td>
                    <td className="py-3.5 text-navy/70">{formatNumber(t.stock)}</td>
                    <td className="py-3.5">
                      <AdminBadge status={t.active ? "active" : "inactive"} />
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(t)}
                          className="rounded-full bg-canvas px-3 py-1.5 text-xs font-bold text-navy ring-1 ring-soft hover:bg-primary/10 hover:text-primary"
                        >
                          {t.active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(t);
                            setSheetOpen(true);
                          }}
                          aria-label="Edit"
                          className="grid h-8 w-8 place-items-center rounded-full bg-canvas text-navy ring-1 ring-soft hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t)}
                          aria-label="Hapus"
                          className="grid h-8 w-8 place-items-center rounded-full bg-canvas text-red-500 ring-1 ring-soft hover:bg-red-50"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-3 sm:hidden">
              {tiers.map((t) => (
                <div key={t.id} className="rounded-2xl bg-canvas p-4 ring-1 ring-soft/70">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-navy">{serviceName(t.serviceId)}</p>
                    <AdminBadge status={t.active ? "active" : "inactive"} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-navy/60">
                    <p>Supplier: <span className="font-semibold text-navy">{formatCurrency(t.supplierPrice)}</span></p>
                    <p>Jual: <span className="font-semibold text-navy">{formatCurrency(t.sellPrice)}</span></p>
                    <p>Profit: <span className="font-semibold text-emerald-600">{formatCurrency(computeProfit(t))}</span></p>
                    <p>Stok: <span className="font-semibold text-navy">{formatNumber(t.stock)}</span></p>
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(t)}
                      className="flex-1 rounded-full bg-white px-3 py-2 text-xs font-bold text-navy ring-1 ring-soft"
                    >
                      {t.active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(t);
                        setSheetOpen(true);
                      }}
                      className="grid h-9 w-9 place-items-center rounded-full bg-white text-navy ring-1 ring-soft"
                      aria-label="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t)}
                      className="grid h-9 w-9 place-items-center rounded-full bg-white text-red-500 ring-1 ring-soft"
                      aria-label="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      <AdminPriceTierFormSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        tier={editing}
        services={services}
        countryCode={countryCode}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
