"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-5 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className="grid h-9 w-9 place-items-center rounded-full text-navy/60 transition-colors hover:bg-canvas disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronLeft size={17} />
      </button>
      {Array.from({ length: totalPages }).map((_, i) => {
        const n = i + 1;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-current={page === n ? "page" : undefined}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full text-sm font-bold transition-colors",
              page === n ? "bg-primary text-white" : "text-navy/60 hover:bg-canvas",
            )}
          >
            {n}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Next page"
        className="grid h-9 w-9 place-items-center rounded-full text-navy/60 transition-colors hover:bg-canvas disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight size={17} />
      </button>
    </div>
  );
}
