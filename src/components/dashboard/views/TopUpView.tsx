"use client";

import { useEffect, useState } from "react";
import { Bitcoin, ShieldCheck, Wallet } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { useUser } from "@/components/dashboard/UserProvider";
import { useToast } from "@/components/dashboard/ToastProvider";
import { getPaymentMethods, topUp } from "@/lib/dashboard/api";
import { quickTopUpAmounts } from "@/lib/dashboard/data";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { PaymentMethod } from "@/lib/dashboard/types";

const ICONS = { Bitcoin, Wallet } as const;
const DEPOSIT_POLL_ATTEMPTS = 24;
const DEPOSIT_POLL_INTERVAL_MS = 2500;

export function TopUpView() {
  const { user, updateUser } = useUser();
  const toast = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [methodId, setMethodId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [depositStatus, setDepositStatus] = useState<"idle" | "checking" | "done">("idle");

  useEffect(() => {
    getPaymentMethods().then((m) => {
      setMethods(m);
      setMethodId(m[0]?.id ?? null);
    });
  }, []);

  // Returning from OxaPay's hosted invoice page: the callback webhook may
  // not have landed yet, so poll our own status endpoint for a while
  // instead of assuming success just because the browser came back.
  useEffect(() => {
    const depositId = new URLSearchParams(window.location.search).get("deposit");
    if (!depositId) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to the ?deposit= query param present on mount, not a render-triggered sync
    setDepositStatus("checking");

    async function poll() {
      for (let attempt = 0; attempt < DEPOSIT_POLL_ATTEMPTS; attempt++) {
        if (cancelled) return;
        const supabase = getSupabaseClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (token) {
          try {
            const res = await fetch(`/api/payments/oxapay/status?depositId=${encodeURIComponent(depositId!)}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const result = await res.json();
            if (result.ok && result.status === "success") {
              if (cancelled) return;
              setDepositStatus("done");
              if (typeof result.balance === "number") updateUser({ balance: result.balance });
              toast(`Top up berhasil! Saldo bertambah ${formatCurrency(result.amount)}.`, "success");
              return;
            }
            if (result.ok && (result.status === "failed" || result.status === "expired")) {
              if (cancelled) return;
              setDepositStatus("done");
              toast("Pembayaran gagal atau kedaluwarsa.", "error");
              return;
            }
          } catch {
            // network hiccup — just retry on the next attempt
          }
        }
        await new Promise((resolve) => setTimeout(resolve, DEPOSIT_POLL_INTERVAL_MS));
      }
      if (!cancelled) {
        setDepositStatus("done");
        toast("Pembayaran masih diproses. Saldo akan diperbarui begitu konfirmasi diterima.", "info");
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [toast, updateUser]);

  const selectedMethod = methods.find((m) => m.id === methodId);
  const fee = selectedMethod?.feeFlat ?? 0;
  const total = amount ? amount + fee : 0;

  function handleQuickSelect(value: number) {
    setAmount(value);
    setCustomAmount(String(value));
  }

  function handleCustomChange(value: string) {
    let cleaned = value.replace(/[^\d.]/g, "");
    const firstDot = cleaned.indexOf(".");
    if (firstDot !== -1) {
      cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
    }
    setCustomAmount(cleaned);
    const parsed = Number(cleaned);
    setAmount(cleaned && Number.isFinite(parsed) ? parsed : null);
  }

  async function handleSubmit() {
    if (!amount || amount <= 0 || !methodId) return;
    setLoading(true);
    const result = await topUp(amount, methodId);
    if (result.ok) {
      window.location.href = result.invoiceUrl;
      return;
    }
    setLoading(false);
    toast(result.message, "info");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">Top Up Balance</h1>
        <p className="mt-1.5 text-navy/60">Top up your balance to start buying virtual numbers.</p>
      </div>

      {depositStatus === "checking" && (
        <div className="rounded-2xl bg-primary/10 px-5 py-4 text-sm font-semibold text-primary">
          Memproses pembayaran crypto Anda — ini bisa memakan waktu beberapa menit...
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <SectionCard title="Amount">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {quickTopUpAmounts.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => handleQuickSelect(a)}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm font-bold ring-1 transition-colors",
                    amount === a
                      ? "bg-primary text-white ring-primary"
                      : "bg-canvas text-navy ring-soft hover:bg-primary/10",
                  )}
                >
                  {formatCurrency(a)}
                </button>
              ))}
            </div>

            <div className="mt-5">
              <label htmlFor="custom-amount" className="mb-1.5 block text-sm font-semibold text-navy">
                Or enter a custom amount
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-navy/45">
                  $
                </span>
                <input
                  id="custom-amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  className="w-full rounded-2xl bg-white py-3 pl-8 pr-4 text-navy ring-1 ring-soft transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Payment Method">
            <div className="space-y-2.5">
              {methods.map((m) => {
                const Icon = ICONS[m.icon as keyof typeof ICONS] ?? Wallet;
                const active = methodId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethodId(m.id)}
                    className={cn(
                      "flex w-full items-center gap-3.5 rounded-2xl px-4 py-3.5 text-left ring-1 transition-colors",
                      active ? "bg-primary/10 ring-primary" : "bg-canvas ring-soft hover:bg-primary/5",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                        active ? "bg-primary text-white" : "bg-white text-navy/60 ring-1 ring-soft",
                      )}
                    >
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-navy">{m.label}</span>
                      <span className="block text-xs text-navy/50">{m.description}</span>
                    </span>
                    {m.feeFlat > 0 ? (
                      <span className="shrink-0 text-xs font-semibold text-navy/50">
                        +{formatCurrency(m.feeFlat)}
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs font-semibold text-emerald-600">Free</span>
                    )}
                  </button>
                );
              })}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Summary">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-navy/55">Current Balance</dt>
                <dd className="font-semibold text-navy">{user ? formatCurrency(user.balance) : "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-navy/55">Top Up Amount</dt>
                <dd className="font-semibold text-navy">{amount ? formatCurrency(amount) : "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-navy/55">Admin Fee</dt>
                <dd className="font-semibold text-navy">{fee > 0 ? formatCurrency(fee) : "Free"}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-soft pt-3">
                <dt className="font-bold text-navy">Total Payment</dt>
                <dd className="text-lg font-extrabold text-primary">{formatCurrency(total)}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!amount || amount <= 0 || loading}
              className="mt-6 w-full rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-[0_14px_30px_-8px_rgb(40_117_251/0.7)] transition-all hover:-translate-y-0.5 hover:bg-deep disabled:pointer-events-none disabled:opacity-50 disabled:translate-y-0"
            >
              {loading ? "Processing…" : "Continue to Payment"}
            </button>

            <p className="mt-4 flex items-start gap-2 text-xs text-navy/50">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-500" />
              Your payment information is encrypted and processed securely.
            </p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
