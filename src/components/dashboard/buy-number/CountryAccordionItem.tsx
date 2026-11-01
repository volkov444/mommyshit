"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, Layers } from "lucide-react";
import { Flag } from "@/components/dashboard/Flag";
import { cn } from "@/lib/cn";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { CountryWithTiers, PriceTier } from "@/lib/dashboard/api";

type Props = {
  country: CountryWithTiers;
  expanded: boolean;
  onToggle: () => void;
  onSelectTier: (tier: PriceTier) => void;
};

export function CountryAccordionItem({ country, expanded, onToggle, onSelectTier }: Props) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl ring-1 transition-colors",
        expanded ? "bg-primary/5 ring-primary/40" : "bg-canvas ring-soft",
      )}
    >
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-4 px-4 py-3.5 text-left">
        <Flag code={country.code} className="text-2xl" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-navy">{country.name}</p>
          <p className="text-xs text-navy/45">
            {country.tiers.length} price options · {formatNumber(country.totalStock)} in stock
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/40">From</p>
          <p className="font-extrabold text-primary">{formatCurrency(country.cheapestPrice)}</p>
        </div>
        <ChevronDown
          size={18}
          className={cn("shrink-0 text-navy/40 transition-transform", expanded && "rotate-180 text-primary")}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="max-h-96 space-y-2.5 overflow-y-auto border-t border-soft/70 px-3 pb-3.5 pt-3.5">
              {country.tiers.map((tier, i) => {
                const isCheapest = i === 0 && country.tiers.length > 1;
                return (
                  <button
                    key={`${tier.price}-${i}`}
                    type="button"
                    onClick={() => onSelectTier(tier)}
                    className="group flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3.5 text-left ring-1 ring-soft transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-10px_rgb(40_117_251/0.35)] hover:ring-primary/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
                          isCheapest ? "bg-primary/10 text-primary" : "bg-canvas text-navy/40",
                        )}
                      >
                        <Layers size={18} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-lg font-extrabold leading-tight text-navy">{formatCurrency(tier.price)}</p>
                          {isCheapest && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                              Cheapest
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-navy/45">Stock {formatNumber(tier.stock)}</p>
                      </div>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-canvas px-3.5 py-2 text-sm font-bold text-navy/60 transition-colors group-hover:bg-primary group-hover:text-white">
                      Select
                      <ChevronRight size={15} />
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
