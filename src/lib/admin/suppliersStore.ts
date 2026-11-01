// Supplier config CRUD — purely localStorage-backed, no network calls here.
// The real supplier API call (balance/key check) lives server-side in
// src/app/api/admin/suppliers/test-connection/route.ts and only ever updates
// `connectionStatus` through updateSupplier below. The real VAK-SMS number
// purchase/SMS-poll/cancel flow (src/app/api/numbers/*) reads its own
// server-only VAKSMS_API_URL/VAKSMS_API_KEY env vars instead of this
// localStorage-backed config, since that flow is reached by any logged-in
// user's browser, not just the admin's.

import { logActivity } from "./activityLogStore";
import { seedSuppliers } from "./seedData";
import type { Supplier } from "./types";

const STORAGE_KEY = "bluffy_demo_suppliers";

function readStore(): Supplier[] {
  if (typeof window === "undefined") return seedSuppliers;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Supplier[];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSuppliers));
    return seedSuppliers;
  } catch {
    return seedSuppliers;
  }
}

function writeStore(suppliers: Supplier[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers));
  } catch {
    // storage unavailable — demo data is best-effort
  }
}

export function getSuppliers(): Supplier[] {
  return readStore();
}

export function getSupplierById(id: string): Supplier | undefined {
  return readStore().find((s) => s.id === id);
}

export function addSupplier(supplier: Omit<Supplier, "id" | "updatedAt">, actorId: string, actorName: string): Supplier {
  const suppliers = readStore();
  const full: Supplier = { ...supplier, id: `sup_${Date.now().toString(36)}`, updatedAt: new Date().toISOString() };
  writeStore([...suppliers, full]);
  logActivity({ actorId, actorName, action: `Menambahkan supplier ${full.name}`, targetType: "supplier", targetId: full.id });
  return full;
}

export function updateSupplier(id: string, patch: Partial<Omit<Supplier, "id">>, actorId: string, actorName: string): Supplier | undefined {
  const suppliers = readStore();
  const idx = suppliers.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  const updated = { ...suppliers[idx], ...patch, updatedAt: new Date().toISOString() };
  const next = [...suppliers];
  next[idx] = updated;
  writeStore(next);
  logActivity({ actorId, actorName, action: `Memperbarui konfigurasi supplier ${updated.name}`, targetType: "supplier", targetId: id });
  return updated;
}

export function deleteSupplier(id: string, actorId: string, actorName: string): void {
  const suppliers = readStore();
  const target = suppliers.find((s) => s.id === id);
  writeStore(suppliers.filter((s) => s.id !== id));
  if (target) logActivity({ actorId, actorName, action: `Menghapus supplier ${target.name}`, targetType: "supplier", targetId: id });
}
