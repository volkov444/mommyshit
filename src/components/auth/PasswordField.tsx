"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AuthField } from "./AuthField";
import { cn } from "@/lib/cn";
import { getPasswordStrength } from "@/lib/validation";

type Props = {
  id: string;
  label: string;
  autoComplete?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | null;
  showStrength?: boolean;
};

const STRENGTH_COPY = {
  weak: { label: "Weak", className: "bg-red-400", width: "w-1/3" },
  fair: { label: "Fair", className: "bg-amber-400", width: "w-2/3" },
  strong: { label: "Strong", className: "bg-emerald-500", width: "w-full" },
} as const;

export function PasswordField({
  id,
  label,
  autoComplete,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  showStrength,
}: Props) {
  const [visible, setVisible] = useState(false);
  const strength = showStrength && value ? getPasswordStrength(value) : null;

  return (
    <div>
      <AuthField
        id={id}
        label={label}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        error={error}
        rightSlot={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="grid h-9 w-9 place-items-center rounded-xl text-navy/50 transition-colors hover:bg-canvas hover:text-navy"
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
      />
      {strength && (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-soft/60">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                STRENGTH_COPY[strength].className,
                STRENGTH_COPY[strength].width,
              )}
            />
          </div>
          <span className="text-xs font-semibold text-navy/55">
            {STRENGTH_COPY[strength].label}
          </span>
        </div>
      )}
    </div>
  );
}
