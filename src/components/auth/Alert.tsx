"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  tone: "error" | "success";
  children: React.ReactNode;
};

export function Alert({ tone, children }: Props) {
  const isError = tone === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium",
        isError ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600",
      )}
    >
      {isError ? (
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
      )}
      <span>{children}</span>
    </div>
  );
}
