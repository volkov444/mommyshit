"use client";

import { useState } from "react";
import { Copy, Share2 } from "lucide-react";
import { Sheet } from "./Sheet";
import { useToast } from "@/components/dashboard/ToastProvider";

type Props = {
  open: boolean;
  onClose: () => void;
  code: string;
};

export function InviteFriendSheet({ open, onClose, code }: Props) {
  const toast = useToast();
  const [copying, setCopying] = useState(false);

  async function handleCopy() {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(code);
      toast("Referral code copied.", "success");
    } catch {
      toast("Couldn't copy automatically — copy the code manually.", "info");
    }
    setCopying(false);
  }

  async function handleShare() {
    const text = `Join Bluffy and use my referral code ${code} to help me earn a bonus!`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // user cancelled the share sheet — nothing to do
      }
      return;
    }
    await handleCopy();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Invite a Friend" description="Invite friends to join and earn bonus balance.">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-soft bg-canvas px-4 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">Your referral code</p>
            <p className="mt-1 font-mono text-lg font-extrabold text-navy">{code}</p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            disabled={copying}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-primary ring-1 ring-soft transition-colors hover:bg-primary/10 disabled:opacity-60"
          >
            <Copy size={15} />
            Copy
          </button>
        </div>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-8px_rgb(40_117_251/0.7)] transition-all hover:-translate-y-0.5 hover:bg-deep"
        >
          <Share2 size={16} />
          Share Invite
        </button>
        <p className="text-xs text-navy/45">
          You&apos;ll earn 10% of their amount the moment a friend signs up with your code and makes their first deposit.
        </p>
      </div>
    </Sheet>
  );
}
