import Image from "next/image";
import { site } from "@/lib/site";
import { cn } from "@/lib/cn";

export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <Image
        src="/assets/mascot-icon.png"
        alt=""
        width={1774}
        height={1774}
        priority
        className="h-8 w-8 shrink-0 rounded-xl object-cover"
      />
      {!compact && (
        <span
          className={cn(
            "text-xl font-extrabold tracking-tight",
            light ? "text-white" : "text-navy",
          )}
        >
          {site.name}
        </span>
      )}
    </span>
  );
}
