"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Percent } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Flag } from "@/components/dashboard/Flag";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { useToast } from "@/components/dashboard/ToastProvider";
import { getSession } from "@/lib/admin/session";
import { getPriceTiers, computeProfit, applyMarkupToAll } from "@/lib/admin/pricingStore";
import { getCountries } from "@/lib/admin/countriesStore";
import { formatNumber } from "@/lib/format";

type CountrySummary = {
  code: string;
  name: string;
  serviceCount: number;
  avgMarkupPercent: number;
  totalStock: number;
  active: boolean;
};

async function computeSummaries(): Promise<CountrySummary[]> {
  const [tiers, countries] = await Promise.all([getPriceTiers(), getCountries()]);
  const byCountry = new Map<string, CountrySummary & { markupSum: number; markupCount: number }>();
  for (const tier of tiers) {
    const country = countries.find((c) => c.code === tier.countryCode);
    if (!country) continue;
    const existing = byCountry.get(tier.countryCode) ?? {
      code: country.code,
      name: country.name,
      serviceCount: 0,
      avgMarkupPercent: 0,
      totalStock: 0,
      active: false,
      markupSum: 0,
      markupCount: 0,
    };
    byCountry.set(tier.countryCode, existing);
  }
  for (const tier of tiers) {
    const entry = byCountry.get(tier.countryCode);
    if (!entry) continue;
    entry.totalStock += tier.stock;
    if (tier.active) entry.active = true;
    if (tier.supplierPrice > 0) {
      entry.markupSum += (computeProfit(tier) / tier.supplierPrice) * 100;
      entry.markupCount += 1;
    }
  }
  for (const code of byCountry.keys()) {
    const entry = byCountry.get(code)!;
    const serviceIds = new Set(tiers.filter((t) => t.countryCode === code).map((t) => t.serviceId));
    entry.serviceCount = serviceIds.size;
    entry.avgMarkupPercent = entry.markupCount > 0 ? entry.markupSum / entry.markupCount : 0;
  }
  return [...byCountry.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function AdminPricingView() {
  const toast = useToast();
  const [summaries, setSummaries] = useState<CountrySummary[] | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPercent, setBulkPercent] = useState("65");
  const [applying, setApplying] = useState(false);

  async function reload() {
    setSummaries(await computeSummaries());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the shared store on mount, not a render-triggered sync
    reload();
  }, []);

  async function handleApplyMarkup() {
    const percent = Number(bulkPercent);
    if (!Number.isFinite(percent) || percent < 0) {
      toast("Masukkan persentase markup yang valid.", "error");
      return;
    }
    setApplying(true);
    try {
      const session = getSession();
      const actorId = session.userId;
      const actorName = session.name;
      const count = await applyMarkupToAll(percent, actorId, actorName);
      await reload();
      setBulkOpen(false);
      toast(`Markup ${percent}% diterapkan ke ${count} tier harga di semua negara.`, "success");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">Negara & Harga</h1>
          <p className="mt-1.5 text-navy/60">Kelola harga dan stok nomor untuk setiap negara.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {bulkOpen ? (
            <div className="flex items-center gap-2 rounded-full bg-canvas p-1.5 pl-4 ring-1 ring-soft">
              <span className="text-sm font-semibold text-navy">Markup</span>
              <input
                type="number"
                min={0}
                value={bulkPercent}
                onChange={(e) => setBulkPercent(e.target.value)}
                className="w-16 rounded-full bg-white px-2 py-1 text-sm text-navy ring-1 ring-soft focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span className="text-sm font-semibold text-navy">%</span>
              <button
                type="button"
                onClick={handleApplyMarkup}
                disabled={applying}
                className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {applying ? "Menerapkan..." : "Terapkan ke Semua"}
              </button>
              <button type="button" onClick={() => setBulkOpen(false)} className="px-2 text-xs font-bold text-navy/50 hover:text-navy">
                Batal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setBulkOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-4 py-2.5 text-sm font-bold text-navy ring-1 ring-soft transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <Percent size={15} />
              Markup Massal
            </button>
          )}
        </div>
      </div>

      <SectionCard>
        {!summaries ? (
          <p className="py-8 text-center text-sm text-navy/50">Memuat...</p>
        ) : (
          <>
            <table className="hidden w-full text-left text-sm sm:table">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wider text-navy/40">
                  <th className="pb-3 font-bold">Negara</th>
                  <th className="pb-3 font-bold">Jumlah Layanan</th>
                  <th className="pb-3 font-bold">Markup Rata-rata</th>
                  <th className="pb-3 font-bold">Total Stok</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-soft/70">
                {summaries.map((c) => (
                  <tr key={c.code}>
                    <td className="py-3.5 font-semibold text-navy">
                      <span className="inline-flex items-center gap-2">
                        <Flag code={c.code} />
                        {c.name}
                      </span>
                    </td>
                    <td className="py-3.5 text-navy/70">{formatNumber(c.serviceCount)}</td>
                    <td className="py-3.5 font-semibold text-emerald-600">+{Math.round(c.avgMarkupPercent)}%</td>
                    <td className="py-3.5 text-navy/70">{formatNumber(c.totalStock)}</td>
                    <td className="py-3.5">
                      <AdminBadge status={c.active ? "active" : "inactive"} />
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        href={`/admin/pricing/${c.code}`}
                        className="inline-flex items-center gap-1 rounded-full bg-canvas px-3 py-1.5 text-xs font-bold text-navy ring-1 ring-soft transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        Kelola
                        <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-3 sm:hidden">
              {summaries.map((c) => (
                <Link
                  key={c.code}
                  href={`/admin/pricing/${c.code}`}
                  className="flex items-center gap-3 rounded-2xl bg-canvas p-4 ring-1 ring-soft/70"
                >
                  <Flag code={c.code} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-navy">{c.name}</p>
                    <p className="text-xs text-navy/50">
                      {c.serviceCount} layanan · {formatNumber(c.totalStock)} stok · <span className="font-semibold text-emerald-600">+{Math.round(c.avgMarkupPercent)}% markup</span>
                    </p>
                  </div>
                  <AdminBadge status={c.active ? "active" : "inactive"} />
                  <ChevronRight size={16} className="text-navy/30" />
                </Link>
              ))}
            </div>
          </>
        )}
      </SectionCard>
    </div>
  );
}
