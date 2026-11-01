"use client";

import Link from "next/link";
import { ChevronLeft, ShieldCheck, Wallet } from "lucide-react";
import { Flag } from "@/components/dashboard/Flag";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { Country, Service } from "@/lib/dashboard/types";

type Props = {
  service: Service;
  country: Country;
  price: number;
  stock: number;
  balance: number;
  confirming: boolean;
  onBack: () => void;
  onConfirm: () => void;
};

export function ConfirmStep({ service, country, price, stock, balance, confirming, onBack, onConfirm }: Props) {
  const sufficient = balance >= price;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-navy/55 transition-colors hover:text-primary"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      <h2 className="text-lg font-extrabold tracking-tight text-navy">Confirm Purchase</h2>
      <p className="mt-1 text-sm text-navy/55">Review your order before buying this number.</p>

      <div className="mt-5 rounded-2xl bg-canvas p-5 ring-1 ring-soft">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white ring-1 ring-soft">
            <Flag code={country.code} className="text-2xl" />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-navy">{service.name}</p>
            <p className="text-sm text-navy/55">{country.name}</p>
          </div>
          <p className="ml-auto shrink-0 text-xl font-extrabold text-primary">{formatCurrency(price)}</p>
        </div>

        <dl className="mt-5 space-y-2.5 border-t border-soft pt-4 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-navy/55">Number price</dt>
            <dd className="font-semibold text-navy">{formatCurrency(price)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-navy/55">Stock available</dt>
            <dd className="font-semibold text-navy">{formatNumber(stock)} numbers</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-navy/55">Estimated processing</dt>
            <dd className="font-semibold text-navy">Instant · within a few seconds</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-navy/55">Current balance</dt>
            <dd className="font-semibold text-navy">{formatCurrency(balance)}</dd>
          </div>
          <div className="flex items-center justify-between border-t border-soft pt-2.5 text-base">
            <dt className="font-bold text-navy">Total payment</dt>
            <dd className="font-extrabold text-primary">{formatCurrency(price)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-primary/5 px-4 py-3 text-xs text-navy/55">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" />
        <p>
          Your balance is charged immediately and a real number is reserved for you. If no SMS arrives, you can
          cancel for a full refund — see the Cancel button under your active number.
        </p>
      </div>

      {!sufficient && (
        <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3.5 sm:flex-row sm:items-center">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-600">
            <Wallet size={16} />
            Insufficient balance to complete this purchase.
          </p>
          <Link
            href="/dashboard/topup"
            className="shrink-0 rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-600"
          >
            Top Up Balance
          </Link>
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-canvas px-6 py-3 text-sm font-bold text-navy ring-1 ring-soft transition-colors hover:bg-soft/40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!sufficient || confirming}
          className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-8px_rgb(40_117_251/0.7)] transition-all hover:-translate-y-0.5 hover:bg-deep disabled:pointer-events-none disabled:opacity-60"
        >
          {confirming ? "Processing…" : "Confirm & Buy Number"}
        </button>
      </div>
    </div>
  );
}
