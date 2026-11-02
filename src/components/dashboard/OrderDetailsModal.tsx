"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, X } from "lucide-react";
import { Badge } from "./Badge";
import { Flag } from "./Flag";
import { formatDateTime, formatCurrency } from "@/lib/format";
import type { Order } from "@/lib/dashboard/types";

type Props = {
  order: Order | null;
  onClose: () => void;
};

function OtpCell({ otp }: { otp: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!otp) return <span className="font-mono">Not received yet</span>;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(otp!);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — nothing to show, the OTP is still on screen to copy manually
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Klik untuk menyalin kode OTP"
      className="inline-flex items-center gap-1.5 font-mono text-emerald-600 transition-opacity hover:opacity-75"
    >
      {otp}
      {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={13} className="text-emerald-600/60" />}
    </button>
  );
}

const ROWS: Array<{ label: string; render: (o: Order) => React.ReactNode }> = [
  { label: "Order ID", render: (o) => <span className="font-mono">{o.id}</span> },
  { label: "Service", render: (o) => o.serviceName },
  {
    label: "Country",
    render: (o) => (
      <span className="inline-flex items-center gap-1.5">
        <Flag code={o.countryCode} />
        {o.countryName}
      </span>
    ),
  },
  { label: "Phone Number", render: (o) => <span className="font-mono">{o.phoneNumber}</span> },
  { label: "Price", render: (o) => formatCurrency(o.price) },
  { label: "OTP Code", render: (o) => <OtpCell otp={o.otp} /> },
  { label: "Status", render: (o) => <Badge status={o.status} /> },
  { label: "Created At", render: (o) => formatDateTime(o.createdAt) },
];

export function OrderDetailsModal({ order, onClose }: Props) {
  return (
    <AnimatePresence>
      {order && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-navy/40 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-[2rem] bg-white p-6 shadow-lift sm:rounded-[2rem] sm:p-7"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold tracking-tight text-navy">Order Details</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full text-navy/50 transition-colors hover:bg-canvas"
              >
                <X size={18} />
              </button>
            </div>

            <dl className="mt-5 divide-y divide-soft/70">
              {ROWS.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <dt className="text-navy/55">{row.label}</dt>
                  <dd className="font-semibold text-navy">{row.render(order)}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
