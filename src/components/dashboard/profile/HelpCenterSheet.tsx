"use client";

import { Sheet } from "./Sheet";

const FAQ = [
  {
    q: "How do I buy a virtual number?",
    a: "Open the Buy Number menu, choose a service and country, then pick an available price.",
  },
  {
    q: "How do I get a refund if a number fails to receive an SMS?",
    a: "Use the Cancel Order button on the active number, or contact Customer Service.",
  },
  {
    q: "How do I top up my balance?",
    a: "Open the Top Up menu, choose an amount, then pick a payment method.",
  },
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
};

export function HelpCenterSheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Help Center" description="Refunds, how-to & frequently asked questions.">
      <div className="space-y-3">
        {FAQ.map((item) => (
          <div key={item.q} className="rounded-2xl bg-canvas p-4 ring-1 ring-soft/70">
            <p className="text-sm font-bold text-navy">{item.q}</p>
            <p className="mt-1 text-sm text-navy/60">{item.a}</p>
          </div>
        ))}
      </div>
    </Sheet>
  );
}
