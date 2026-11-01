"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
  error?: string | null;
};

export function Checkbox({ id, checked, onChange, children, error }: Props) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer select-none items-start gap-2.5">
        <span className="relative mt-0.5 shrink-0">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            aria-invalid={!!error}
            className="peer sr-only"
          />
          <span
            className={cn(
              "grid h-5 w-5 place-items-center rounded-md ring-1 transition-colors",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2",
              checked ? "bg-primary ring-primary" : "bg-white ring-soft",
            )}
          >
            {checked && <Check size={13} strokeWidth={3} className="text-white" />}
          </span>
        </span>
        <span className="text-sm text-navy/75">{children}</span>
      </label>
      {error && <p className="mt-1.5 text-sm font-medium text-red-500">{error}</p>}
    </div>
  );
}
