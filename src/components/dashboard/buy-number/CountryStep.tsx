"use client";

import { useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { Skeleton } from "@/components/dashboard/Skeleton";
import { CountryAccordionItem } from "./CountryAccordionItem";
import type { Service } from "@/lib/dashboard/types";
import type { CountryWithTiers, PriceTier } from "@/lib/dashboard/api";

type Props = {
  service: Service;
  countries: CountryWithTiers[];
  loading: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onSelectTier: (country: CountryWithTiers, tier: PriceTier) => void;
  onBack: () => void;
};

export function CountryStep({ service, countries, loading, query, onQueryChange, onSelectTier, onBack }: Props) {
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const filtered = countries.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-navy/55 transition-colors hover:text-primary"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      <h2 className="text-lg font-extrabold tracking-tight text-navy">Choose Your Country</h2>
      <p className="mt-1 text-sm text-navy/55">
        Available countries for <span className="font-bold text-navy">{service.name}</span>. Tap a country to see
        its price options.
      </p>

      <div className="relative mb-4 mt-5">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy/35" />
        <input
          placeholder="Search country…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="w-full rounded-2xl bg-canvas py-2.5 pl-11 pr-4 text-sm text-navy ring-1 ring-soft transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <CountryAccordionItem
              key={c.code}
              country={c}
              expanded={expandedCode === c.code}
              onToggle={() => setExpandedCode((prev) => (prev === c.code ? null : c.code))}
              onSelectTier={(tier) => onSelectTier(c, tier)}
            />
          ))}
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-navy/45">No countries found for {service.name}.</p>
          )}
        </div>
      )}
    </div>
  );
}
