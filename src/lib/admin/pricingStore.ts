// Price tier catalog, backed by Supabase (see supabase/catalog_schema.sql)
// so every user/admin session sees the same pricing instead of a per-browser
// localStorage copy. The table starts empty — tiers are populated by
// importing a supplier catalogue (Admin > Supplier > Lihat Katalog).

import { getSupabaseClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLogStore";
import type { AdminPriceTier } from "./types";

type PriceTierRow = {
  id: string;
  service_id: string;
  country_code: string;
  supplier_price: number;
  sell_price: number;
  stock: number;
  active: boolean;
  supplier_service_code: string | null;
};

const PRICE_TIER_COLUMNS = "id, service_id, country_code, supplier_price, sell_price, stock, active, supplier_service_code";

function fromRow(row: PriceTierRow): AdminPriceTier {
  return {
    id: row.id,
    serviceId: row.service_id,
    countryCode: row.country_code,
    supplierPrice: row.supplier_price,
    sellPrice: row.sell_price,
    stock: row.stock,
    active: row.active,
    supplierServiceCode: row.supplier_service_code,
  };
}

function toRow(tier: Omit<AdminPriceTier, "id">): Omit<PriceTierRow, "id"> {
  return {
    service_id: tier.serviceId,
    country_code: tier.countryCode,
    supplier_price: tier.supplierPrice,
    sell_price: tier.sellPrice,
    stock: tier.stock,
    active: tier.active,
    supplier_service_code: tier.supplierServiceCode ?? null,
  };
}

export async function getPriceTiers(): Promise<AdminPriceTier[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("price_tiers").select(PRICE_TIER_COLUMNS);
  if (error || !data) return [];
  return data.map(fromRow);
}

export async function getPriceTiersFor(serviceId: string, countryCode: string): Promise<AdminPriceTier[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("price_tiers")
    .select(PRICE_TIER_COLUMNS)
    .eq("service_id", serviceId)
    .eq("country_code", countryCode)
    .eq("active", true)
    .gt("stock", 0)
    .order("sell_price");
  if (error || !data) return [];
  return data.map(fromRow);
}

export async function getPriceTiersForCountry(countryCode: string): Promise<AdminPriceTier[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("price_tiers")
    .select(PRICE_TIER_COLUMNS)
    .eq("country_code", countryCode);
  if (error || !data) return [];
  return data.map(fromRow);
}

export function computeProfit(tier: Pick<AdminPriceTier, "supplierPrice" | "sellPrice">): number {
  return tier.sellPrice - tier.supplierPrice;
}

export async function addPriceTier(tier: Omit<AdminPriceTier, "id">, actorId: string, actorName: string): Promise<AdminPriceTier> {
  const supabase = getSupabaseClient();
  const id = `pt_${Date.now().toString(36)}`;
  const { data, error } = await supabase
    .from("price_tiers")
    .insert({ id, ...toRow(tier) })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to add price tier.");

  logActivity({ actorId, actorName, action: `Menambahkan tier harga untuk ${tier.serviceId} — ${tier.countryCode}`, targetType: "pricing", targetId: id });
  return fromRow(data);
}

export async function updatePriceTier(id: string, patch: Partial<Omit<AdminPriceTier, "id">>, actorId: string, actorName: string): Promise<AdminPriceTier | undefined> {
  const supabase = getSupabaseClient();
  const dbPatch: Record<string, unknown> = {};
  if (patch.serviceId !== undefined) dbPatch.service_id = patch.serviceId;
  if (patch.countryCode !== undefined) dbPatch.country_code = patch.countryCode;
  if (patch.supplierPrice !== undefined) dbPatch.supplier_price = patch.supplierPrice;
  if (patch.sellPrice !== undefined) dbPatch.sell_price = patch.sellPrice;
  if (patch.stock !== undefined) dbPatch.stock = patch.stock;
  if (patch.active !== undefined) dbPatch.active = patch.active;
  if (patch.supplierServiceCode !== undefined) dbPatch.supplier_service_code = patch.supplierServiceCode;

  const { data, error } = await supabase.from("price_tiers").update(dbPatch).eq("id", id).select().maybeSingle();
  if (error || !data) return undefined;

  logActivity({ actorId, actorName, action: `Mengubah harga ${data.service_id} — ${data.country_code}`, targetType: "pricing", targetId: id });
  return fromRow(data);
}

// Batch upsert for a supplier catalogue import — one insert call and one
// upsert call total (plus one activity log entry) for the whole batch,
// which can be thousands of tiers across every service's price points,
// instead of one round-trip per tier.
export async function bulkUpsertPriceTiers(
  entries: { serviceId: string; countryCode: string; supplierPrice: number; sellPrice: number; stock: number; active: boolean; supplierServiceCode: string | null }[],
  actorId: string,
  actorName: string,
): Promise<{ created: number; updated: number }> {
  if (entries.length === 0) return { created: 0, updated: 0 };
  const supabase = getSupabaseClient();
  const existing = await getPriceTiersForServicesCountries(entries);

  const byKey = new Map<string, AdminPriceTier[]>();
  for (const t of existing) {
    const key = `${t.serviceId}:${t.countryCode}`;
    const arr = byKey.get(key);
    if (arr) arr.push(t);
    else byKey.set(key, [t]);
  }

  const toInsert: PriceTierRow[] = [];
  const toUpdate: PriceTierRow[] = [];
  let counter = 0;

  for (const entry of entries) {
    const key = `${entry.serviceId}:${entry.countryCode}`;
    const candidates = byKey.get(key) ?? [];
    const match = candidates.find((t) => Math.abs(t.supplierPrice - entry.supplierPrice) < 0.00005);
    if (match) {
      toUpdate.push({ id: match.id, ...toRow(entry) });
    } else {
      counter++;
      const id = `pt_${Date.now().toString(36)}_${counter}`;
      const row: PriceTierRow = { id, ...toRow(entry) };
      toInsert.push(row);
      candidates.push(fromRow(row));
      byKey.set(key, candidates);
    }
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("price_tiers").insert(toInsert);
    if (error) throw new Error(error.message);
  }
  if (toUpdate.length > 0) {
    const { error } = await supabase.from("price_tiers").upsert(toUpdate);
    if (error) throw new Error(error.message);
  }

  logActivity({ actorId, actorName, action: `Impor katalog: ${toInsert.length} tier harga baru, ${toUpdate.length} diperbarui`, targetType: "pricing" });
  return { created: toInsert.length, updated: toUpdate.length };
}

async function getPriceTiersForServicesCountries(entries: { serviceId: string; countryCode: string }[]): Promise<AdminPriceTier[]> {
  const supabase = getSupabaseClient();
  const serviceIds = Array.from(new Set(entries.map((e) => e.serviceId)));
  const countryCodes = Array.from(new Set(entries.map((e) => e.countryCode)));
  const { data, error } = await supabase
    .from("price_tiers")
    .select(PRICE_TIER_COLUMNS)
    .in("service_id", serviceIds)
    .in("country_code", countryCodes);
  if (error || !data) return [];
  return data.map(fromRow);
}

// Batched the same way bulkUpsertPriceTiers is: one upsert call per chunk
// of rows instead of one update round-trip per tier, since "apply to all
// countries" can mean thousands of tiers.
const MARKUP_CHUNK_SIZE = 500;

export async function applyMarkupToAll(percent: number, actorId: string, actorName: string, countryCode?: string): Promise<number> {
  const supabase = getSupabaseClient();
  const tiers = countryCode ? await getPriceTiersForCountry(countryCode) : await getPriceTiers();

  const rows: PriceTierRow[] = tiers.map((t) => ({
    id: t.id,
    service_id: t.serviceId,
    country_code: t.countryCode,
    supplier_price: t.supplierPrice,
    sell_price: t.supplierPrice > 0 ? Math.round(t.supplierPrice * (1 + percent / 100) * 100) / 100 : 0,
    stock: t.stock,
    active: t.active,
    supplier_service_code: t.supplierServiceCode,
  }));

  for (let i = 0; i < rows.length; i += MARKUP_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + MARKUP_CHUNK_SIZE);
    const { error } = await supabase.from("price_tiers").upsert(chunk);
    if (error) throw new Error(error.message);
  }

  logActivity({
    actorId,
    actorName,
    action: countryCode
      ? `Menerapkan markup ${percent}% ke semua tier harga di ${countryCode}`
      : `Menerapkan markup ${percent}% ke semua tier harga di semua negara`,
    targetType: "pricing",
  });
  return tiers.length;
}

export async function deletePriceTier(id: string, actorId: string, actorName: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.from("price_tiers").select("service_id, country_code").eq("id", id).maybeSingle();
  const { error } = await supabase.from("price_tiers").delete().eq("id", id);
  if (!error && data) logActivity({ actorId, actorName, action: `Menghapus tier harga ${data.service_id} — ${data.country_code}`, targetType: "pricing", targetId: id });
}

export async function deletePriceTiersForServices(serviceIds: string[], actorId: string, actorName: string): Promise<number> {
  if (serviceIds.length === 0) return 0;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("price_tiers").delete().in("service_id", serviceIds).select();
  const removedCount = data?.length ?? 0;
  if (!error && removedCount > 0) logActivity({ actorId, actorName, action: `Menghapus ${removedCount} tier harga sekaligus`, targetType: "pricing" });
  return removedCount;
}
