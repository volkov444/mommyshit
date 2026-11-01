"use client";

import { useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/dashboard/profile/Sheet";
import { useToast } from "@/components/dashboard/ToastProvider";
import { getSession } from "@/lib/admin/session";
import { getServices, bulkAddServices, prettifyServiceName } from "@/lib/admin/servicesStore";
import { bulkUpsertPriceTiers } from "@/lib/admin/pricingStore";
import { getCountryByCode, addCountry, flagFromCode, dialCodeFromCode } from "@/lib/admin/countriesStore";
import type { Supplier } from "@/lib/admin/types";
import type { Country } from "@/lib/dashboard/types";

type Props = {
  open: boolean;
  onClose: () => void;
  supplier: Supplier | null;
};

type CountryOption = { code: string; label: string };
type ServiceRow = { name: string; price?: string; stock?: string; code?: string };

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function firstString(rec: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number") return String(v);
  }
  return undefined;
}

function normalizeCountries(data: unknown): CountryOption[] | null {
  if (Array.isArray(data)) {
    if (data.length === 0) return [];
    return data.map((item, i) => {
      if (typeof item === "string") return { code: item, label: item };
      const rec = asRecord(item);
      if (rec) {
        const code = firstString(rec, ["countryCode", "id", "code", "country", "iso"]) ?? String(i);
        const label = firstString(rec, ["countryName", "name", "title", "country", "ru", "en"]) ?? code;
        return { code, label };
      }
      return { code: String(item), label: String(item) };
    });
  }
  const rec = asRecord(data);
  if (rec) {
    return Object.entries(rec).map(([code, v]) => {
      const vRec = asRecord(v);
      const label = typeof v === "string" ? v : vRec ? (firstString(vRec, ["name", "title"]) ?? code) : code;
      return { code, label };
    });
  }
  return null;
}

// VAK-SMS's real per-country pricing shape (confirmed live via the backend
// /backend/service/stats endpoint): an array of services, each with a
// `available` array of real price tiers — [{ count, price }, ...]. A
// service can have anywhere from 1 to a dozen+ tiers, so every tier becomes
// its own row (not just the first/cheapest one).
function normalizeStats(data: unknown): ServiceRow[] | null {
  if (!Array.isArray(data)) return null;
  const rows: ServiceRow[] = [];
  for (const item of data) {
    const rec = asRecord(item);
    if (!rec) continue;
    const name = firstString(rec, ["name", "serviceName", "title"]);
    const code = firstString(rec, ["id", "code"]);
    if (!name) continue;
    const available = Array.isArray(rec.available) ? rec.available : null;
    if (available && available.length > 0) {
      for (const tier of available) {
        const tierRec = asRecord(tier);
        if (!tierRec) continue;
        rows.push({
          name,
          code,
          price: firstString(tierRec, ["price"]),
          stock: firstString(tierRec, ["count"]),
        });
      }
    } else {
      rows.push({
        name,
        code,
        price: firstString(rec, ["minPrice", "apiPrice"]),
        stock: firstString(rec, ["count"]),
      });
    }
  }
  return rows;
}

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `layanan-${Date.now().toString(36)}`;
}

function parseNumber(value: string | undefined): number {
  if (!value) return 0;
  const n = parseFloat(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

// Serializes the find-or-create-service / upsert-price-tiers step across
// concurrent countries in handleImportAll's worker pool. Each step now
// awaits several Supabase round-trips, so without this lock two workers can
// both see "service X doesn't exist yet" at the same instant and both try
// to create it, colliding on the same id. The API fetches that precede this
// step stay concurrent — only the DB write is serialized.
let importLock: Promise<unknown> = Promise.resolve();
function withImportLock<T>(fn: () => Promise<T>): Promise<T> {
  const result = importLock.then(fn, fn);
  importLock = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export function AdminSupplierCatalogSheet({ open, onClose, supplier }: Props) {
  const toast = useToast();
  const [importing, setImporting] = useState(false);
  const [importingAll, setImportingAll] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number; countryName: string } | null>(null);
  const bulkCancelRef = useRef(false);
  const [countryOptions, setCountryOptions] = useState<CountryOption[] | null>(null);
  const [rawCountries, setRawCountries] = useState<unknown>(null);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [loadingCountries, setLoadingCountries] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState("");
  const [services, setServices] = useState<ServiceRow[] | null>(null);
  const [rawServices, setRawServices] = useState<unknown>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [loadingServices, setLoadingServices] = useState(false);

  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (!open || !supplier) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting catalog state when the sheet opens for a (possibly different) supplier, not a render-triggered sync
    setCountryOptions(null);
    setRawCountries(null);
    setCountriesError(null);
    setSelectedCountry("");
    setServices(null);
    setRawServices(null);
    setServicesError(null);
    setShowRaw(false);
    setLoadingCountries(true);

    fetch("/api/admin/suppliers/vaksms-catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiUrl: supplier.apiUrl, apiKey: supplier.apiKey, action: "countries" }),
    })
      .then((r) => r.json())
      .then((result) => {
        if (result.ok) {
          setRawCountries(result.data);
          setCountryOptions(normalizeCountries(result.data));
        } else {
          setCountriesError(result.message ?? "Gagal memuat daftar negara.");
        }
      })
      .catch(() => setCountriesError("Gagal memuat daftar negara."))
      .finally(() => setLoadingCountries(false));
  }, [open, supplier]);

  function loadServices(country: string) {
    if (!supplier || !country) return;
    setSelectedCountry(country);
    setServices(null);
    setRawServices(null);
    setServicesError(null);
    setLoadingServices(true);
    fetch("/api/admin/suppliers/vaksms-catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiUrl: supplier.apiUrl, apiKey: supplier.apiKey, action: "stats", country }),
    })
      .then((r) => r.json())
      .then((result) => {
        if (result.ok) {
          setRawServices(result.data);
          setServices(normalizeStats(result.data));
        } else {
          setServicesError(result.message ?? "Gagal memuat daftar layanan.");
        }
      })
      .catch(() => setServicesError("Gagal memuat daftar layanan."))
      .finally(() => setLoadingServices(false));
  }

  const catalogLabel = countryOptions?.find((c) => c.code === selectedCountry)?.label;
  const [localCountry, setLocalCountry] = useState<Country | undefined>(undefined);
  const [localCountryExists, setLocalCountryExists] = useState(false);

  useEffect(() => {
    if (!selectedCountry) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing the resolved country synchronously when the selection is cleared, not a render-triggered sync
      setLocalCountry(undefined);
      setLocalCountryExists(false);
      return;
    }
    let cancelled = false;
    getCountryByCode(selectedCountry).then((existing) => {
      if (cancelled) return;
      if (existing) {
        setLocalCountry(existing);
        setLocalCountryExists(true);
      } else {
        setLocalCountry({
          code: selectedCountry.toUpperCase(),
          name: catalogLabel ?? selectedCountry.toUpperCase(),
          flag: flagFromCode(selectedCountry),
          dialCode: dialCodeFromCode(selectedCountry),
        });
        setLocalCountryExists(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedCountry, catalogLabel]);

  // Shared by both the single-country import and the "Impor Semua Negara"
  // bulk loop below — resolves/creates the local country, then
  // finds-or-creates each service and upserts its price tiers. A supplier
  // catalogue can have thousands of (service, tier) rows for one country,
  // so every mutation is batched into one services write + one price-tier
  // write (via bulkAddServices/bulkUpsertPriceTiers) instead of one
  // read+write per row — the per-row version was slow enough to freeze the
  // tab on a single country's worth of real data.
  async function importRowsForCountry(code: string, label: string, rows: ServiceRow[], actorId: string, actorName: string): Promise<{ country: Country; imported: number }> {
    const existing = await getCountryByCode(code);
    const candidate: Country = existing ?? {
      code: code.toUpperCase(),
      name: label || code.toUpperCase(),
      flag: flagFromCode(code),
      dialCode: dialCodeFromCode(code),
    };
    const country = existing ?? (await addCountry(candidate, actorId, actorName));

    const existingServices = await getServices();
    const nameToService = new Map(existingServices.map((s) => [s.name.toLowerCase(), s]));
    const usedIds = new Set(existingServices.map((s) => s.id));

    const toCreate: { id: string; name: string; icon: string; description: string; active: boolean }[] = [];
    for (const row of rows) {
      if (!row.name.trim()) continue;
      const displayName = prettifyServiceName(row.name);
      const key = displayName.toLowerCase();
      if (nameToService.has(key)) continue;
      let id = slugify(displayName);
      if (usedIds.has(id)) id = `${id}-${Date.now().toString(36)}-${toCreate.length}`;
      usedIds.add(id);
      toCreate.push({ id, name: displayName, icon: "MessageCircle", description: `Diimpor dari katalog ${supplier!.name}`, active: true });
      nameToService.set(key, { id, name: displayName, icon: "MessageCircle", description: toCreate[toCreate.length - 1].description, active: true, order: 0 });
    }
    const created = await bulkAddServices(toCreate, actorId, actorName);
    for (const svc of created) nameToService.set(svc.name.toLowerCase(), svc);

    const tierEntries: { serviceId: string; countryCode: string; supplierPrice: number; sellPrice: number; stock: number; active: boolean; supplierServiceCode: string | null }[] = [];
    for (const row of rows) {
      if (!row.name.trim()) continue;
      const displayName = prettifyServiceName(row.name);
      const service = nameToService.get(displayName.toLowerCase());
      if (!service) continue;
      const supplierPrice = round4(parseNumber(row.price));
      const stock = Math.round(parseNumber(row.stock));
      const sellPrice = supplierPrice > 0 ? round4(supplierPrice * 1.65) : 0;
      tierEntries.push({ serviceId: service.id, countryCode: country.code, supplierPrice, sellPrice, stock, active: true, supplierServiceCode: row.code ?? null });
    }
    const { created: createdTiers, updated: updatedTiers } = await bulkUpsertPriceTiers(tierEntries, actorId, actorName);

    return { country, imported: createdTiers + updatedTiers };
  }

  async function handleImport() {
    if (!supplier || !localCountry || !services || services.length === 0) return;
    setImporting(true);
    try {
      const session = getSession();
      const actorId = session.userId;
      const actorName = session.name;
      const { country, imported } = await importRowsForCountry(localCountry.code, localCountry.name, services, actorId, actorName);
      toast(`${imported} tier harga diimpor ke ${country.name}. Harga disimpan dalam USD apa adanya — cek & sesuaikan di Negara & Harga.`, "success");
    } finally {
      setImporting(false);
    }
  }

  async function fetchServicesForCountry(code: string): Promise<ServiceRow[] | null> {
    if (!supplier) return null;
    try {
      const res = await fetch("/api/admin/suppliers/vaksms-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiUrl: supplier.apiUrl, apiKey: supplier.apiKey, action: "stats", country: code }),
      });
      const result = await res.json().catch(() => null);
      if (!result?.ok) return null;
      return normalizeStats(result.data);
    } catch {
      return null;
    }
  }

  // Loops every country VAK-SMS offers (not just the ones Bluffy already
  // knows), since the stats endpoint only returns the services available
  // for ONE country at a time — a single-country import never sees the
  // full catalogue. Runs several countries concurrently (a worker pool over
  // a shared queue) since a fully sequential pass over 250+ countries felt
  // like it had hung. importRowsForCountry awaits several Supabase
  // round-trips, so its DB-writing step is run through withImportLock to
  // serialize it across workers — only the API fetches stay concurrent.
  async function handleImportAll() {
    if (!supplier || !countryOptions || countryOptions.length === 0) return;
    if (!window.confirm(`Impor layanan dari seluruh ${countryOptions.length} negara? Proses ini memanggil API supplier (beberapa sekaligus) dan masih bisa makan waktu beberapa menit.`)) return;

    setImportingAll(true);
    bulkCancelRef.current = false;
    const session = getSession();
    const actorId = session.userId;
    const actorName = session.name;
    let totalImported = 0;
    let countriesWithData = 0;
    let done = 0;

    const queue = [...countryOptions];
    const total = countryOptions.length;
    const CONCURRENCY = 8;

    async function worker() {
      while (queue.length > 0) {
        if (bulkCancelRef.current) return;
        const c = queue.shift();
        if (!c) return;
        const rows = await fetchServicesForCountry(c.code);
        if (bulkCancelRef.current) return;
        if (rows && rows.length > 0) {
          const { imported } = await withImportLock(() => importRowsForCountry(c.code, c.label, rows, actorId, actorName));
          if (imported > 0) {
            totalImported += imported;
            countriesWithData++;
          }
        }
        done++;
        setBulkProgress({ done, total, countryName: c.label });
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

    setBulkProgress(null);
    setImportingAll(false);
    toast(
      bulkCancelRef.current
        ? `Impor dibatalkan setelah ${done}/${total} negara — ${totalImported} tier harga sudah masuk di ${countriesWithData} negara.`
        : `Impor semua negara selesai: ${totalImported} tier harga diimpor di ${countriesWithData} negara.`,
      "success",
    );
  }

  function handleCancelImportAll() {
    bulkCancelRef.current = true;
  }

  if (!supplier) return null;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Katalog ${supplier.name}`}
      description="Data referensi langsung dari API supplier. Bisa diimpor ke Layanan & Negara/Harga lokal secara manual per negara."
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="catalog-country" className="mb-1.5 block text-sm font-semibold text-navy">
            Negara
          </label>
          {loadingCountries ? (
            <p className="text-sm text-navy/50">Memuat daftar negara...</p>
          ) : countriesError ? (
            <p className="text-sm text-red-500">{countriesError}</p>
          ) : countryOptions && countryOptions.length > 0 ? (
            <>
              <select
                id="catalog-country"
                value={selectedCountry}
                onChange={(e) => loadServices(e.target.value)}
                disabled={importingAll}
                className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              >
                <option value="">Pilih negara...</option>
                {countryOptions.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px] text-navy/45">
                Katalog harga VAK-SMS (termasuk semua tier harganya) berbeda-beda per negara — impor satu-satu di atas, atau sekaligus semua {countryOptions.length} negara di bawah.
              </p>
              <button
                type="button"
                onClick={handleImportAll}
                disabled={importingAll}
                className="mt-2 w-full rounded-full bg-canvas px-4 py-2.5 text-sm font-bold text-primary ring-1 ring-soft transition-colors hover:bg-primary/10 disabled:opacity-60"
              >
                {importingAll ? "Mengimpor semua negara..." : `Impor Semua Negara (${countryOptions.length})`}
              </button>
              {bulkProgress && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.round((bulkProgress.done / Math.max(bulkProgress.total, 1)) * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-navy/50">
                      {bulkProgress.done}/{bulkProgress.total} — {bulkProgress.countryName}
                    </p>
                    <button type="button" onClick={handleCancelImportAll} className="shrink-0 text-[11px] font-bold text-red-500 hover:underline">
                      Batalkan
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-navy/50">Format data negara tidak dikenali — lihat data mentah di bawah.</p>
          )}
        </div>

        {selectedCountry && (
          <div>
            <p className="mb-1.5 text-sm font-semibold text-navy">Layanan di {countryOptions?.find((c) => c.code === selectedCountry)?.label ?? selectedCountry}</p>
            {loadingServices ? (
              <p className="text-sm text-navy/50">Memuat daftar layanan...</p>
            ) : servicesError ? (
              <p className="text-sm text-red-500">{servicesError}</p>
            ) : services && services.length > 0 ? (
              <>
                <div className="max-h-64 overflow-y-auto rounded-xl ring-1 ring-soft">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-canvas">
                      <tr className="text-navy/40">
                        <th className="px-3 py-2 font-bold">Layanan</th>
                        <th className="px-3 py-2 font-bold">Harga Supplier (USD)</th>
                        <th className="px-3 py-2 font-bold">Stok</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-soft/70">
                      {services.map((s, i) => (
                        <tr key={`${s.name}-${i}`}>
                          <td className="px-3 py-2 font-semibold text-navy">{prettifyServiceName(s.name)}</td>
                          <td className="px-3 py-2 text-navy/70">{s.price ? `$${s.price}` : "—"}</td>
                          <td className="px-3 py-2 text-navy/70">{s.stock ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {localCountry && (
                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] text-navy/45">
                      Harga disimpan apa adanya dalam USD dari supplier (tidak dikonversi ke Rupiah) — markup +65% diterapkan otomatis saat impor, cek lagi di Negara & Harga.
                      {!localCountryExists && " Negara ini belum ada di Bluffy — akan ditambahkan otomatis saat diimpor."}
                    </p>
                    <button
                      type="button"
                      onClick={handleImport}
                      disabled={importing || importingAll}
                      className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgb(40_117_251/0.6)] transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {importing ? "Mengimpor..." : `Impor ke Layanan & Harga (${localCountry.name})`}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-navy/50">Tidak ada data layanan untuk negara ini.</p>
            )}
          </div>
        )}

        {(rawCountries !== null || rawServices !== null) && (
          <div>
            <button
              type="button"
              onClick={() => setShowRaw((v) => !v)}
              className="text-xs font-bold text-primary hover:underline"
            >
              {showRaw ? "Sembunyikan data mentah" : "Lihat data mentah"}
            </button>
            {showRaw && (
              <pre className="mt-2 max-h-48 overflow-auto rounded-xl bg-navy/5 p-3 text-[10px] text-navy/70">
                {JSON.stringify(rawServices ?? rawCountries, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}
