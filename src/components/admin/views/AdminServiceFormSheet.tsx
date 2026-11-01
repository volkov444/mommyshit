"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/dashboard/profile/Sheet";
import type { Service } from "@/lib/dashboard/types";

export const SERVICE_ICON_NAMES = ["MessageCircle", "Send", "Mail", "Users", "Camera", "Music2", "Gamepad2", "ShoppingCart"] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  service: Service | null;
  onSubmit: (values: { id: string; name: string; icon: string; description: string }) => void;
};

export function AdminServiceFormSheet({ open, onClose, service, onSubmit }: Props) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>(SERVICE_ICON_NAMES[0]);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the form fields when the sheet opens for a different service, not a render-triggered sync
    setId(service?.id ?? "");
    setName(service?.name ?? "");
    setIcon(service?.icon ?? SERVICE_ICON_NAMES[0]);
    setDescription(service?.description ?? "");
  }, [open, service]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const slug = service ? service.id : id.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    onSubmit({ id: slug, name: name.trim(), icon, description: description.trim() });
  }

  return (
    <Sheet open={open} onClose={onClose} title={service ? "Edit Layanan" : "Tambah Layanan"}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="service-name" className="mb-1.5 block text-sm font-semibold text-navy">
            Nama Layanan
          </label>
          <input
            id="service-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="WhatsApp"
            className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label htmlFor="service-icon" className="mb-1.5 block text-sm font-semibold text-navy">
            Ikon
          </label>
          <select
            id="service-icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {SERVICE_ICON_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="service-description" className="mb-1.5 block text-sm font-semibold text-navy">
            Deskripsi
          </label>
          <textarea
            id="service-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="SMS verification numbers for..."
            className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft placeholder:text-navy/35 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgb(40_117_251/0.6)] transition-opacity hover:opacity-90"
        >
          {service ? "Simpan Perubahan" : "Tambah Layanan"}
        </button>
      </form>
    </Sheet>
  );
}
