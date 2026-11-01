"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Plus, Smartphone } from "lucide-react";
import { assets } from "@/lib/site";
import { formatCurrency } from "@/lib/format";
import { useUser } from "./UserProvider";
import { Skeleton } from "./Skeleton";

export function BalanceCard() {
  const { user } = useUser();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-deep to-navy px-6 py-7 text-white shadow-lift sm:px-8 sm:py-9">
      <div
        aria-hidden
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(rgb(255 255 255 / .6) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "linear-gradient(to right, #000, transparent 65%)",
          WebkitMaskImage: "linear-gradient(to right, #000, transparent 65%)",
        }}
      />
      <div aria-hidden className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />

      <div className="relative grid gap-6 sm:grid-cols-[1.3fr_1fr] sm:items-center">
        <div>
          <p className="text-sm font-semibold text-white/70">Current Balance</p>
          {user ? (
            <p className="mt-2 text-4xl font-extrabold tracking-tight">{formatCurrency(user.balance)}</p>
          ) : (
            <Skeleton className="mt-2 h-10 w-44 bg-white/20" />
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard/topup"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-deep shadow-[0_14px_30px_-10px_rgb(0_0_0/0.5)] transition-all hover:-translate-y-0.5 hover:bg-soft"
            >
              <Plus size={16} />
              Top Up Balance
            </Link>
            <Link
              href="/dashboard/buy-number"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/30 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/20"
            >
              <Smartphone size={16} />
              Buy Number
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <div className="relative mx-auto hidden w-36 sm:block">
          <Image
            src={assets.wave.src}
            width={assets.wave.width}
            height={assets.wave.height}
            alt="Bluffy waving hello"
            className="h-auto w-full drop-shadow-[0_18px_28px_rgb(3_14_80/0.45)]"
          />
        </div>
      </div>
    </div>
  );
}
