"use client";

import { useEffect, useState } from "react";
import { BookOpen, Pencil, Plug, Plus, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Skeleton } from "@/components/dashboard/Skeleton";
import { useToast } from "@/components/dashboard/ToastProvider";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { AdminSupplierFormSheet } from "./AdminSupplierFormSheet";
import { AdminSupplierCatalogSheet } from "./AdminSupplierCatalogSheet";
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from "@/lib/admin/suppliersStore";
import { getSession } from "@/lib/admin/session";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { Supplier } from "@/lib/admin/types";

export function AdminSuppliersView() {
  const toast = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [catalogSupplier, setCatalogSupplier] = useState<Supplier | null>(null);

  function reload() {
    setSuppliers(getSuppliers());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the localStorage demo store on mount, not a render-triggered sync
    reload();
  }, []);

  function actor() {
    const session = getSession();
    return { actorId: session.userId, actorName: session.name };
  }

  function handleSubmit(values: { name: string; apiUrl: string; apiKey: string; active: boolean }) {
    const { actorId, actorName } = actor();
    if (editing) {
      updateSupplier(editing.id, values, actorId, actorName);
      toast(`Supplier ${values.name} berhasil diperbarui.`, "success");
    } else {
      addSupplier({ ...values, connectionStatus: "disconnected", serviceCount: 0 }, actorId, actorName);
      toast(`Supplier ${values.name} berhasil ditambahkan.`, "success");
    }
    reload();
    setSheetOpen(false);
    setEditing(null);
  }

  function handleDelete(supplier: Supplier) {
    const { actorId, actorName } = actor();
    deleteSupplier(supplier.id, actorId, actorName);
    reload();
    toast(`Supplier ${supplier.name} dihapus.`, "success");
  }

  async function handleTestConnection(supplier: Supplier) {
    setTestingId(supplier.id);
    try {
      const res = await fetch("/api/admin/suppliers/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiUrl: supplier.apiUrl, apiKey: supplier.apiKey }),
      });
      const result = await res.json();
      const { actorId, actorName } = actor();
      if (result.ok) {
        updateSupplier(supplier.id, { connectionStatus: "connected" }, actorId, actorName);
        toast(`Terhubung ke ${supplier.name}. Saldo: ${formatNumber(result.balance)}`, "success");
      } else {
        updateSupplier(supplier.id, { connectionStatus: "disconnected" }, actorId, actorName);
        toast(result.message ?? "Gagal terhubung ke supplier.", "error");
      }
      reload();
    } catch {
      toast("Gagal terhubung ke supplier.", "error");
    } finally {
      setTestingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">Manajemen Supplier</h1>
          <p className="mt-1.5 text-navy/60">
            Konfigurasi supplier nomor virtual. &quot;Test Koneksi&quot; memanggil API supplier secara nyata untuk memeriksa kunci API — pembelian nomor tetap berjalan dalam mode demo.
          </p>
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
          Tambah Supplier
        </button>
      </div>

      <SectionCard>
        {!suppliers ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <>
            <table className="hidden w-full text-left text-sm sm:table">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wider text-navy/40">
                  <th className="pb-3 font-bold">Nama Supplier</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold">Koneksi</th>
                  <th className="pb-3 font-bold">Jumlah Layanan</th>
                  <th className="pb-3 font-bold">Terakhir Diperbarui</th>
                  <th className="pb-3 font-bold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-soft/70">
                {suppliers.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3.5 font-semibold text-navy">{s.name}</td>
                    <td className="py-3.5"><AdminBadge status={s.active ? "active" : "inactive"} /></td>
                    <td className="py-3.5"><AdminBadge status={s.connectionStatus} /></td>
                    <td className="py-3.5 text-navy/70">{s.serviceCount}</td>
                    <td className="py-3.5 text-navy/55">{formatDateTime(s.updatedAt)}</td>
                    <td className="py-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTestConnection(s)}
                          disabled={testingId === s.id}
                          aria-label="Test Koneksi"
                          title="Test Koneksi"
                          className="grid h-8 w-8 place-items-center rounded-full bg-canvas text-navy ring-1 ring-soft hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                        >
                          <Plug size={13} className={testingId === s.id ? "animate-pulse" : ""} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCatalogSupplier(s)}
                          aria-label="Lihat Katalog"
                          title="Lihat Katalog"
                          className="grid h-8 w-8 place-items-center rounded-full bg-canvas text-navy ring-1 ring-soft hover:bg-primary/10 hover:text-primary"
                        >
                          <BookOpen size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(s);
                            setSheetOpen(true);
                          }}
                          aria-label="Edit"
                          className="grid h-8 w-8 place-items-center rounded-full bg-canvas text-navy ring-1 ring-soft hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s)}
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
              {suppliers.map((s) => (
                <div key={s.id} className="rounded-2xl bg-canvas p-4 ring-1 ring-soft/70">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-navy">{s.name}</p>
                    <AdminBadge status={s.active ? "active" : "inactive"} />
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-navy/50">
                    <AdminBadge status={s.connectionStatus} />
                    <span>{s.serviceCount} layanan</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTestConnection(s)}
                      disabled={testingId === s.id}
                      className="flex-1 rounded-full bg-white px-3 py-2 text-xs font-bold text-navy ring-1 ring-soft disabled:opacity-50"
                    >
                      {testingId === s.id ? "Menguji..." : "Test Koneksi"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatalogSupplier(s)}
                      className="flex-1 rounded-full bg-white px-3 py-2 text-xs font-bold text-navy ring-1 ring-soft"
                    >
                      Katalog
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(s);
                        setSheetOpen(true);
                      }}
                      className="flex-1 rounded-full bg-white px-3 py-2 text-xs font-bold text-navy ring-1 ring-soft"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s)}
                      className="flex-1 rounded-full bg-white px-3 py-2 text-xs font-bold text-red-500 ring-1 ring-soft"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      <AdminSupplierFormSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        supplier={editing}
        onSubmit={handleSubmit}
      />

      <AdminSupplierCatalogSheet open={!!catalogSupplier} onClose={() => setCatalogSupplier(null)} supplier={catalogSupplier} />
    </div>
  );
}
