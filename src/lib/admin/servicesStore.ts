// Service catalog, backed by Supabase (see supabase/catalog_schema.sql) so
// every user/admin session sees the same list instead of a per-browser
// localStorage copy.

import { getSupabaseClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLogStore";
import type { Service } from "@/lib/dashboard/types";

const IMPORTED_MARKER = "Diimpor dari katalog";
const DOMAIN_TLD_RE = /\.(com|net|org|io|co|tv|app|me|biz|info|xyz|shop|store|online|site|ru)$/i;

type ServiceRow = { id: string; name: string; icon: string; description: string; active: boolean; sort_order: number };

function fromRow(row: ServiceRow): Service {
  return { id: row.id, name: row.name, icon: row.icon, description: row.description, active: row.active, order: row.sort_order };
}

// Supplier catalogues return raw domains ("twitch.tv", "facebook.com") as
// service names. Strip the TLD and capitalize all-lowercase names so they
// read like proper service names; names that already carry their own
// casing (e.g. "GMX", "Ticketmaster") are left untouched.
export function prettifyServiceName(raw: string): string {
  const trimmed = raw.trim();
  const withoutTld = trimmed.replace(DOMAIN_TLD_RE, "");
  if (!withoutTld) return trimmed;
  if (/[A-Z]/.test(withoutTld)) return withoutTld;
  return withoutTld.charAt(0).toUpperCase() + withoutTld.slice(1);
}

export async function getServices(): Promise<Service[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("services").select("id, name, icon, description, active, sort_order").order("sort_order");
  if (error || !data) return [];
  return data.map(fromRow);
}

export async function getActiveServices(): Promise<Service[]> {
  return (await getServices()).filter((s) => s.active);
}

export async function getServiceById(id: string): Promise<Service | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, icon, description, active, sort_order")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return undefined;
  return fromRow(data);
}

export async function addService(service: Omit<Service, "order">, actorId: string, actorName: string): Promise<Service> {
  const supabase = getSupabaseClient();
  const existing = await getServices();
  const maxOrder = existing.reduce((max, s) => Math.max(max, s.order), -1);

  const { data, error } = await supabase
    .from("services")
    .insert({ id: service.id, name: service.name, icon: service.icon, description: service.description, active: service.active, sort_order: maxOrder + 1 })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to add service.");

  logActivity({ actorId, actorName, action: `Menambahkan layanan ${service.name}`, targetType: "service", targetId: service.id });
  return fromRow(data);
}

// Batch variant of addService — one insert and one activity log entry for
// the whole batch, instead of one of each per service. A supplier
// catalogue import can create hundreds of new services in a single pass.
export async function bulkAddServices(services: Omit<Service, "order">[], actorId: string, actorName: string): Promise<Service[]> {
  if (services.length === 0) return [];
  const supabase = getSupabaseClient();
  const existing = await getServices();
  let maxOrder = existing.reduce((max, s) => Math.max(max, s.order), -1);

  const rows = services.map((s) => {
    maxOrder++;
    return { id: s.id, name: s.name, icon: s.icon, description: s.description, active: s.active, sort_order: maxOrder };
  });

  const { data, error } = await supabase.from("services").insert(rows).select();
  if (error || !data) throw new Error(error?.message ?? "Failed to add services.");

  logActivity({ actorId, actorName, action: `Menambahkan ${data.length} layanan sekaligus`, targetType: "service" });
  return data.map(fromRow);
}

export async function updateService(id: string, patch: Partial<Omit<Service, "id">>, actorId: string, actorName: string): Promise<Service | undefined> {
  const supabase = getSupabaseClient();
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.icon !== undefined) dbPatch.icon = patch.icon;
  if (patch.description !== undefined) dbPatch.description = patch.description;
  if (patch.active !== undefined) dbPatch.active = patch.active;
  if (patch.order !== undefined) dbPatch.sort_order = patch.order;

  const { data, error } = await supabase.from("services").update(dbPatch).eq("id", id).select().maybeSingle();
  if (error || !data) return undefined;

  logActivity({ actorId, actorName, action: `Memperbarui layanan ${data.name}`, targetType: "service", targetId: id });
  return fromRow(data);
}

export async function deleteService(id: string, actorId: string, actorName: string): Promise<void> {
  const target = await getServiceById(id);
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (!error && target) logActivity({ actorId, actorName, action: `Menghapus layanan ${target.name}`, targetType: "service", targetId: id });
}

export async function deleteServices(ids: string[], actorId: string, actorName: string): Promise<number> {
  if (ids.length === 0) return 0;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("services").delete().in("id", ids).select();
  const removedCount = data?.length ?? 0;
  if (!error && removedCount > 0) logActivity({ actorId, actorName, action: `Menghapus ${removedCount} layanan sekaligus`, targetType: "service" });
  return removedCount;
}

export async function renameImportedServices(actorId: string, actorName: string): Promise<number> {
  const services = await getServices();
  const toRename = services.filter((s) => s.description.includes(IMPORTED_MARKER) && prettifyServiceName(s.name) !== s.name);
  if (toRename.length === 0) return 0;

  const supabase = getSupabaseClient();
  for (const s of toRename) {
    await supabase.from("services").update({ name: prettifyServiceName(s.name) }).eq("id", s.id);
  }

  logActivity({ actorId, actorName, action: `Merapikan nama ${toRename.length} layanan hasil impor`, targetType: "service" });
  return toRename.length;
}

export async function toggleServiceActive(id: string, actorId: string, actorName: string): Promise<Service | undefined> {
  const service = await getServiceById(id);
  if (!service) return undefined;
  return updateService(id, { active: !service.active }, actorId, actorName);
}

export async function reorderServices(orderedIds: string[], actorId: string, actorName: string): Promise<Service[]> {
  const supabase = getSupabaseClient();
  for (let i = 0; i < orderedIds.length; i++) {
    await supabase.from("services").update({ sort_order: i }).eq("id", orderedIds[i]);
  }
  logActivity({ actorId, actorName, action: "Mengubah urutan tampilan layanan", targetType: "service" });
  return getServices();
}
