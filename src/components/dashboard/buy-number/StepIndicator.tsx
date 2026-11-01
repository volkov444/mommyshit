import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

const STEPS = [
  { n: 1, label: "Choose Service" },
  { n: 2, label: "Choose Country" },
  { n: 3, label: "Confirm Purchase" },
] as const;

export function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const state = step === s.n ? "current" : step > s.n ? "done" : "upcoming";
        return (
          <div key={s.n} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-extrabold transition-colors",
                  state !== "upcoming" ? "bg-primary text-white" : "bg-soft/60 text-navy/40",
                  state === "current" && "shadow-[0_8px_18px_-6px_rgb(40_117_251/0.7)]",
                )}
              >
                {state === "done" ? <Check size={15} /> : String(s.n).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-bold sm:inline",
                  state === "upcoming" ? "text-navy/40" : "text-navy",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "mx-3 h-0.5 flex-1 rounded-full transition-colors sm:mx-4",
                  step > s.n ? "bg-primary" : "bg-soft/60",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
