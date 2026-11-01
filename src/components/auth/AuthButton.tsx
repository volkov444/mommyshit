"use client";

import { ArrowRight, Loader2 } from "lucide-react";

type Props = {
  children: React.ReactNode;
  loading?: boolean;
  type?: "submit" | "button";
};

export function AuthButton({ children, loading, type = "submit" }: Props) {
  return (
    <button
      type={type}
      disabled={loading}
      className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 font-semibold text-white shadow-[0_14px_30px_-8px_rgb(40_117_251/0.7)] transition-all hover:-translate-y-0.5 hover:bg-deep disabled:pointer-events-none disabled:opacity-70 disabled:translate-y-0"
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <>
          {children}
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
        </>
      )}
      {loading && "Please wait…"}
    </button>
  );
}
