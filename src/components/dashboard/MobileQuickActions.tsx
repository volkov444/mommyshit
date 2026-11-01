import Link from "next/link";
import { Smartphone, Wallet } from "lucide-react";

export function MobileQuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:hidden">
      <Link
        href="/dashboard/topup"
        className="flex flex-col items-center gap-2 rounded-2xl bg-primary/10 px-4 py-4 text-center ring-1 ring-primary/20 transition-colors active:bg-primary/15"
      >
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-white">
          <Wallet size={19} />
        </span>
        <span className="text-sm font-bold text-navy">Top Up</span>
      </Link>
      <Link
        href="/dashboard/buy-number"
        className="flex flex-col items-center gap-2 rounded-2xl bg-primary px-4 py-4 text-center shadow-[0_14px_30px_-10px_rgb(40_117_251/0.7)] transition-colors active:bg-deep"
      >
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-white">
          <Smartphone size={19} />
        </span>
        <span className="text-sm font-bold text-white">Buy Number</span>
      </Link>
    </div>
  );
}
