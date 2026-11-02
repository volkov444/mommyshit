"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CheckCircle2, Clock, Copy, Phone, RefreshCw, XCircle } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Badge } from "@/components/dashboard/Badge";
import { Flag } from "@/components/dashboard/Flag";
import { useToast } from "@/components/dashboard/ToastProvider";
import { useUser } from "@/components/dashboard/UserProvider";
import { StepIndicator } from "@/components/dashboard/buy-number/StepIndicator";
import { ServiceStep } from "@/components/dashboard/buy-number/ServiceStep";
import { CountryStep } from "@/components/dashboard/buy-number/CountryStep";
import { ConfirmStep } from "@/components/dashboard/buy-number/ConfirmStep";
import {
  cancelOrder,
  getActiveOrders,
  getCountriesForService,
  getServices,
  purchaseNumber,
  refreshSms,
  type CountryWithTiers,
  type PriceTier,
} from "@/lib/dashboard/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Country, Order, Service } from "@/lib/dashboard/types";

type Step = 1 | 2 | 3;

// Mirrors CANCEL_COOLDOWN_MS in src/app/api/numbers/cancel/route.ts — kept
// as a separate constant since that one lives in a server-only route file
// this client component can't import from.
const CANCEL_COOLDOWN_MS = 2 * 60 * 1000;

// VAK-SMS doesn't document how long a rented number stays reserved before
// it's recycled, so this is a conservative client-side assumption (typical
// of SMS-rental services) rather than a value read from their API — once it
// elapses with no SMS received, the number is auto-released the same way a
// manual cancel works, so a user never gets stuck paying for a dead number.
const ORDER_EXPIRY_MS = 20 * 60 * 1000;

function cancelCooldownRemaining(order: Order, now: number): number {
  return Math.max(0, CANCEL_COOLDOWN_MS - (now - new Date(order.createdAt).getTime()));
}

function orderExpiryRemaining(order: Order, now: number): number {
  return Math.max(0, ORDER_EXPIRY_MS - (now - new Date(order.createdAt).getTime()));
}

function formatCooldown(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function BuyNumberView() {
  const toast = useToast();
  const { user, updateUser } = useUser();

  const [services, setServices] = useState<Service[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [copiedOtpOrderId, setCopiedOtpOrderId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const activeNumbersRef = useRef<HTMLDivElement>(null);
  const autoExpiredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const [step, setStep] = useState<Step>(1);
  const [serviceQuery, setServiceQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [service, setService] = useState<Service | null>(null);
  const [countryOptions, setCountryOptions] = useState<CountryWithTiers[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedTier, setSelectedTier] = useState<PriceTier | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    getServices().then(setServices);
    getActiveOrders().then(setActiveOrders);
  }, []);

  useEffect(() => {
    if (!service) return;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- flips the loading flag synchronously so the skeleton shows immediately while the fetch below is in flight
    setLoadingCountries(true);
    getCountriesForService(service.id).then((list) => {
      if (active) {
        setCountryOptions(list);
        setLoadingCountries(false);
      }
    });
    return () => {
      active = false;
    };
  }, [service]);

  function handleSelectService(s: Service) {
    const changed = s.id !== service?.id;
    setService(s);
    if (changed) {
      setSelectedCountry(null);
      setSelectedTier(null);
      setCountryQuery("");
    }
    setStep(2);
  }

  function handleSelectTier(c: CountryWithTiers, tier: PriceTier) {
    setSelectedCountry(c);
    setSelectedTier(tier);
    setStep(3);
  }

  function resetWizard() {
    setStep(1);
    setService(null);
    setSelectedCountry(null);
    setSelectedTier(null);
    setServiceQuery("");
    setCountryQuery("");
  }

  async function handleConfirm() {
    if (!service || !selectedCountry || !selectedTier || !user) return;
    setConfirming(true);
    const result = await purchaseNumber(selectedCountry.code, service.id, selectedTier.price);
    setConfirming(false);

    if (!result.ok) {
      toast(result.message, "error");
      return;
    }

    updateUser({ balance: result.newBalance });
    setActiveOrders((prev) => [result.order, ...prev]);
    toast(`Number purchased! ${result.order.phoneNumber} is ready.`, "success");
    resetWizard();
    requestAnimationFrame(() => {
      activeNumbersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function handleRefresh(orderId: string) {
    setBusyOrderId(orderId);
    const result = await refreshSms(orderId);
    setBusyOrderId(null);
    if (result.ok) {
      setActiveOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, otp: result.otp } : o)));
    }
    toast(result.ok ? "SMS received!" : result.message, result.ok ? "success" : "info");
  }

  async function handleCancel(orderId: string, otpAlreadyReceived: boolean) {
    setBusyOrderId(orderId);
    const result = await cancelOrder(orderId);
    setBusyOrderId(null);
    if (result.ok) {
      setActiveOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (result.newBalance !== undefined) updateUser({ balance: result.newBalance });
      toast(
        otpAlreadyReceived ? "Order marked as completed." : result.newBalance !== undefined ? "Order cancelled — balance refunded." : "Order cancelled.",
        "success",
      );
    } else {
      toast(result.message, "info");
    }
  }

  async function handleCopy(orderId: string, phoneNumber: string) {
    try {
      await navigator.clipboard.writeText(phoneNumber);
      setCopiedOrderId(orderId);
      setTimeout(() => setCopiedOrderId((id) => (id === orderId ? null : id)), 1500);
    } catch {
      toast("Gagal menyalin nomor.", "error");
    }
  }

  async function handleCopyOtp(orderId: string, otp: string) {
    try {
      await navigator.clipboard.writeText(otp);
      setCopiedOtpOrderId(orderId);
      toast("Kode OTP disalin.", "success");
      setTimeout(() => setCopiedOtpOrderId((id) => (id === orderId ? null : id)), 1500);
    } catch {
      toast("Gagal menyalin kode OTP.", "error");
    }
  }

  // Best-effort background release once an order's reservation window runs
  // out with no SMS received — silent on failure (e.g. it already expired
  // supplier-side) since this isn't a user-initiated action.
  useEffect(() => {
    for (const o of activeOrders) {
      if (o.otp || o.status !== "active") continue;
      if (autoExpiredRef.current.has(o.id)) continue;
      if (orderExpiryRemaining(o, now) > 0) continue;
      autoExpiredRef.current.add(o.id);
      cancelOrder(o.id).then((result) => {
        if (result.ok) {
          setActiveOrders((prev) => prev.filter((order) => order.id !== o.id));
          if (result.newBalance !== undefined) updateUser({ balance: result.newBalance });
          toast(`Number for ${o.serviceName} expired and was refunded.`, "info");
        }
      });
    }
  }, [activeOrders, now, toast, updateUser]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">Buy Virtual Numbers</h1>
        <p className="mt-1.5 text-navy/60">Choose your service and country to get started.</p>
      </div>

      <SectionCard>
        <StepIndicator step={step} />
      </SectionCard>

      <SectionCard className="overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {step === 1 && (
              <ServiceStep
                services={services}
                query={serviceQuery}
                onQueryChange={setServiceQuery}
                selectedId={service?.id ?? null}
                onSelect={handleSelectService}
              />
            )}
            {step === 2 && service && (
              <CountryStep
                service={service}
                countries={countryOptions}
                loading={loadingCountries}
                query={countryQuery}
                onQueryChange={setCountryQuery}
                onSelectTier={handleSelectTier}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && service && selectedCountry && selectedTier && (
              <ConfirmStep
                service={service}
                country={selectedCountry}
                price={selectedTier.price}
                stock={selectedTier.stock}
                balance={user?.balance ?? 0}
                confirming={confirming}
                onBack={() => setStep(2)}
                onConfirm={handleConfirm}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </SectionCard>

      <div ref={activeNumbersRef}>
        <SectionCard title="Your Active Numbers" description="Numbers waiting for or receiving an SMS code.">
          {activeOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-navy/50">You have no active numbers right now.</p>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((o) => {
                const cancelRemaining = cancelCooldownRemaining(o, now);
                const expiryRemaining = orderExpiryRemaining(o, now);
                const expirySoon = expiryRemaining > 0 && expiryRemaining <= 5 * 60 * 1000;
                return (
                  <div key={o.id} className="rounded-2xl bg-canvas p-5 ring-1 ring-soft/70">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-xl bg-white ring-1 ring-soft">
                          <Flag code={o.countryCode} className="text-xl" />
                        </span>
                        <div>
                          <p className="font-bold text-navy">{o.serviceName}</p>
                          <p className="text-sm text-navy/55">{o.countryName}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <Badge status={o.status} />
                        {!o.otp && o.status === "active" && (
                          <span className={cn("flex items-center gap-1 text-xs font-semibold", expirySoon ? "text-red-500" : "text-navy/45")}>
                            <Clock size={12} />
                            Expires in {formatCooldown(expiryRemaining)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-white px-4 py-3 ring-1 ring-soft">
                      <Phone size={16} className="text-navy/40" />
                      <span className="font-mono text-sm font-semibold text-navy">{o.phoneNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(o.id, o.phoneNumber)}
                        title="Salin nomor"
                        className="rounded-full p-1.5 text-navy/40 transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        {copiedOrderId === o.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                      <span className="ml-auto text-sm font-bold text-navy">{formatCurrency(o.price)}</span>
                    </div>

                    <div className="mt-3 rounded-xl border border-dashed border-soft px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-navy/40">SMS Code</p>
                      {o.otp ? (
                        <button
                          type="button"
                          onClick={() => handleCopyOtp(o.id, o.otp!)}
                          title="Klik untuk menyalin kode OTP"
                          className="mt-1 flex items-center gap-2 font-mono text-lg font-bold text-emerald-600 transition-opacity hover:opacity-75"
                        >
                          {o.otp}
                          {copiedOtpOrderId === o.id ? <Check size={16} className="text-emerald-600" /> : <Copy size={14} className="text-emerald-600/60" />}
                        </button>
                      ) : (
                        <p className="mt-1 font-mono text-lg font-bold text-navy">Waiting for SMS…</p>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleRefresh(o.id)}
                        disabled={busyOrderId === o.id}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-navy ring-1 ring-soft transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-60"
                      >
                        <RefreshCw size={15} className={cn(busyOrderId === o.id && "animate-spin")} />
                        Refresh SMS
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancel(o.id, Boolean(o.otp))}
                        disabled={busyOrderId === o.id || (cancelRemaining > 0 && !o.otp)}
                        title={cancelRemaining > 0 && !o.otp ? "Tunggu sebentar sebelum membatalkan, untuk mencegah spam." : undefined}
                        className={cn(
                          "inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold ring-1 ring-soft transition-colors disabled:opacity-60",
                          o.otp ? "text-emerald-600 hover:bg-emerald-50" : "text-red-500 hover:bg-red-50",
                        )}
                      >
                        {o.otp ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                        {o.otp ? "Selesai" : cancelRemaining > 0 ? `Cancel in ${formatCooldown(cancelRemaining)}` : "Cancel Order"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
