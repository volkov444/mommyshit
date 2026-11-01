"use client";

import { cn } from "@/lib/cn";

type Props = {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | null;
  rightSlot?: React.ReactNode;
};

export function AuthField({
  id,
  label,
  type = "text",
  autoComplete,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  rightSlot,
}: Props) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-navy">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "w-full rounded-2xl bg-white px-4 py-3 text-navy ring-1 transition-colors placeholder:text-navy/35",
            "focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-primary",
            !!rightSlot && "pr-11",
            error ? "ring-red-300" : "ring-soft",
          )}
        />
        {rightSlot && (
          <div className="absolute inset-y-0 right-1 flex items-center">{rightSlot}</div>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
