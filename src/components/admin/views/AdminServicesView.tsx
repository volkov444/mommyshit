"use client";

import { useEffect, useState } from "react";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Gamepad2,
  Mail,
  MessageCircle,
  Music2,
  Pencil,
  Plus,
  Search,
  Send,
  ShoppingCart,
  Sparkles,
  Trash2,
  Users,
  Wand2,
} from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { useToast } from "@/components/dashboard/ToastProvider";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { AdminServiceFormSheet } from "./AdminServiceFormSheet";
import { getServices, addService, updateService, deleteService, deleteServices, toggleServiceActive, reorderServices, renameImportedServices } from "@/lib/admin/servicesStore";
import { deletePriceTiersForServices } from "@/lib/admin/pricingStore";
import { getSession } from "@/lib/admin/session";
import type { Service } from "@/lib/dashboard/types";

const IMPORTED_MARKER = "Diimpor dari katalog";

const ICONS = { MessageCircle, Send, Mail, Users, Camera, Music2, Gamepad2, ShoppingCart } as const;

export function AdminServicesView() {
  const toast = useToast();
  const [services, setServices] = useState<Service[] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [query, setQuery] = useState("");

  async function reload() {
    setServices(await getServices());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the shared store on mount, not a render-triggered sync
    reload();
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q);
  }, []);

  const filteredServices = services
    ? [...services].sort((a, b) => a.order - b.order).filter((s) => !query.trim() || s.name.toLowerCase().includes(query.trim().toLowerCase()))
    : null;

  function actor() {
    const session = getSession();
    return { actorId: session.userId, actorName: session.name };
  }

  async function handleSubmit(values: { id: string; name: string; icon: string; description: string }) {
    const { actorId, actorName } = actor();
    if (editing) {
      await updateService(editing.id, { name: values.name, icon: values.icon, description: values.description }, actorId, actorName);
      toast(`Layanan ${values.name} berhasil diperbarui.`, "success");
    } else {
      await addService({ id: values.id, name: values.name, icon: values.icon, description: values.description, active: true }, actorId, actorName);
      toast(`Layanan ${values.name} berhasil ditambahkan.`, "success");
    }
    await reload();
    setSheetOpen(false);
    setEditing(null);
  }

  async function handleToggle(service: Service) {
    const { actorId, actorName } = actor();
    await toggleServiceActive(service.id, actorId, actorName);
    await reload();
    toast(`Layanan ${service.name} ${service.active ? "dinonaktifkan" : "diaktifkan"}. Perubahan langsung terlihat di Buy Number pengguna.`, "info");
  }

  async function handleDelete(service: Service) {
    const { actorId, actorName } = actor();
    await deleteService(service.id, actorId, actorName);
    await reload();
    toast(`Layanan ${service.name} dihapus.`, "success");
  }

  async function handleCleanupImported() {
    if (!services) return;
    const imported = services.filter((s) => s.description.includes(IMPORTED_MARKER));
    if (imported.length === 0) return;
    if (!window.confirm(`Hapus ${imported.length} layanan hasil impor beserta tier harganya? Tindakan ini tidak bisa dibatalkan.`)) return;
    const { actorId, actorName } = actor();
    const ids = imported.map((s) => s.id);
    await deleteServices(ids, actorId, actorName);
    await deletePriceTiersForServices(ids, actorId, actorName);
    await reload();
    toast(`${imported.length} layanan hasil impor dan tier harganya dihapus.`, "success");
  }

  async function handleCleanupDemo() {
    if (!services) return;
    const demo = services.filter((s) => !s.description.includes(IMPORTED_MARKER));
    if (demo.length === 0) return;
    if (!window.confirm(`Hapus ${demo.length} layanan demo bawaan beserta tier harganya? Tindakan ini tidak bisa dibatalkan.`)) return;
    const { actorId, actorName } = actor();
    const ids = demo.map((s) => s.id);
    await deleteServices(ids, actorId, actorName);
    await deletePriceTiersForServices(ids, actorId, actorName);
    await reload();
    toast(`${demo.length} layanan demo bawaan dan tier harganya dihapus.`, "success");
  }

  async function handleRenameImported() {
    const { actorId, actorName } = actor();
    const renamed = await renameImportedServices(actorId, actorName);
    await reload();
    toast(renamed > 0 ? `${renamed} nama layanan hasil impor dirapikan.` : "Tidak ada nama yang perlu dirapikan.", renamed > 0 ? "success" : "info");
  }

  async function handleMove(service: Service, direction: -1 | 1) {
    if (!services) return;
    const ordered = [...services].sort((a, b) => a.order - b.order);
    const idx = ordered.findIndex((s) => s.id === service.id);
    const swapWith = idx + direction;
    if (swapWith < 0 || swapWith >= ordered.length) return;
    [ordered[idx], ordered[swapWith]] = [ordered[swapWith], ordered[idx]];
    const { actorId, actorName } = actor();
    await reorderServices(ordered.map((s) => s.id), actorId, actorName);
    await reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">Manajemen Layanan</h1>
          <p className="mt-1.5 text-navy/60">Kelola layanan verifikasi nomor yang tersedia untuk pengguna.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/35" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari layanan..."
              className="w-44 rounded-full bg-canvas py-2.5 pl-9 pr-4 text-sm text-navy ring-1 ring-soft placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          {services?.some((s) => !s.description.includes(IMPORTED_MARKER)) && (
            <button
              type="button"
              onClick={handleCleanupDemo}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-red-500 ring-1 ring-soft transition-colors hover:bg-red-50"
            >
              <Sparkles size={15} />
              Hapus Layanan Demo
            </button>
          )}
          {services?.some((s) => s.description.includes(IMPORTED_MARKER)) && (
            <>
              <button
                type="button"
                onClick={handleRenameImported}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-primary ring-1 ring-soft transition-colors hover:bg-primary/10"
              >
                <Wand2 size={15} />
                Rapikan Nama
              </button>
              <button
                type="button"
                onClick={handleCleanupImported}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-red-500 ring-1 ring-soft transition-colors hover:bg-red-50"
              >
                <Trash2 size={15} />
                Bersihkan Hasil Impor
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setSheetOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgb(40_117_251/0.6)] transition-opacity hover:opacity-90"
          >
            <Plus size={15} />
            Tambah Layanan
          </button>
        </div>
      </div>

      <SectionCard>
        {!services ? (
          <p className="py-8 text-center text-sm text-navy/50">Memuat...</p>
        ) : services.length === 0 ? (
          <p className="py-8 text-center text-sm text-navy/50">Belum ada layanan.</p>
        ) : filteredServices && filteredServices.length === 0 ? (
          <p className="py-8 text-center text-sm text-navy/50">Tidak ada layanan yang cocok dengan pencarian.</p>
        ) : (
          <div className="space-y-2">
            {filteredServices!.map((s, i) => {
              const Icon = ICONS[s.icon as keyof typeof ICONS] ?? MessageCircle;
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-canvas p-4 ring-1 ring-soft/70">
                  <div className="flex shrink-0 flex-col">
                    <button type="button" onClick={() => handleMove(s, -1)} disabled={!!query.trim() || i === 0} className="text-navy/40 hover:text-primary disabled:opacity-30">
                      <ChevronUp size={14} />
                    </button>
                    <button type="button" onClick={() => handleMove(s, 1)} disabled={!!query.trim() || i === filteredServices!.length - 1} className="text-navy/40 hover:text-primary disabled:opacity-30">
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-navy">{s.name}</p>
                    <p className="truncate text-xs text-navy/50">{s.description}</p>
                  </div>
                  <AdminBadge status={s.active ? "active" : "inactive"} />
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggle(s)}
                      className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-navy ring-1 ring-soft hover:bg-primary/10 hover:text-primary"
                    >
                      {s.active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(s);
                        setSheetOpen(true);
                      }}
                      aria-label="Edit"
                      className="grid h-8 w-8 place-items-center rounded-full bg-white text-navy ring-1 ring-soft hover:bg-primary/10 hover:text-primary"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s)}
                      aria-label="Hapus"
                      className="grid h-8 w-8 place-items-center rounded-full bg-white text-red-500 ring-1 ring-soft hover:bg-red-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <AdminServiceFormSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        service={editing}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
