"use client";

import {
  Camera,
  Gamepad2,
  Mail,
  MessageCircle,
  Music2,
  Search,
  Send,
  ShoppingCart,
  Smartphone,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { Service } from "@/lib/dashboard/types";

const SERVICE_ICONS = {
  MessageCircle,
  Send,
  Mail,
  Users,
  Camera,
  Music2,
  Gamepad2,
  ShoppingCart,
} as const;

type Props = {
  services: Service[];
  query: string;
  onQueryChange: (value: string) => void;
  selectedId: string | null;
  onSelect: (service: Service) => void;
};

export function ServiceStep({ services, query, onQueryChange, selectedId, onSelect }: Props) {
  const filtered = services.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <h2 className="text-lg font-extrabold tracking-tight text-navy">Choose Your Service</h2>
      <p className="mt-1 text-sm text-navy/55">Select the platform you want to verify.</p>

      <div className="relative mb-4 mt-5">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy/35" />
        <input
          placeholder="Search service…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="w-full rounded-2xl bg-canvas py-2.5 pl-11 pr-4 text-sm text-navy ring-1 ring-soft transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((s) => {
          const Icon = SERVICE_ICONS[s.icon as keyof typeof SERVICE_ICONS] ?? Smartphone;
          const active = selectedId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s)}
              className={cn(
                "flex flex-col items-center gap-3 rounded-2xl px-4 py-5 text-center ring-1 transition-all",
                active
                  ? "bg-primary text-white ring-primary shadow-[0_14px_30px_-10px_rgb(40_117_251/0.7)]"
                  : "bg-canvas text-navy ring-soft hover:-translate-y-0.5 hover:ring-primary/40",
              )}
            >
              <span
                className={cn(
                  "grid h-11 w-11 place-items-center rounded-xl",
                  active ? "bg-white/20" : "bg-primary/10 text-primary",
                )}
              >
                <Icon size={20} />
              </span>
              <span className="text-sm font-bold">{s.name}</span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-navy/45">No services found.</p>
        )}
      </div>
    </div>
  );
}
