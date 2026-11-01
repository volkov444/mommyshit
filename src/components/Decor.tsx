import { cn } from "@/lib/cn";

export function Star({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("animate-twinkle fill-current", className)}
    >
      <path d="M12 0c.7 6.2 5.8 11.3 12 12-6.2.7-11.3 5.8-12 12-.7-6.2-5.8-11.3-12-12C6.2 11.3 11.3 6.2 12 0Z" />
    </svg>
  );
}

export function Bubble({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "animate-drift pointer-events-none absolute rounded-full",
        "bg-gradient-to-br from-white/90 to-soft/40 shadow-[inset_0_0_12px_rgb(255,255,255,0.8)]",
        className,
      )}
    />
  );
}

export function Ring({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "animate-drift pointer-events-none absolute rounded-full border-[3px] border-primary/30",
        className,
      )}
    />
  );
}
