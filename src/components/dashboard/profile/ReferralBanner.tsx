"use client";

import { Gift } from "lucide-react";

type Props = {
  code: string;
  onInvite: () => void;
};

export function ReferralBanner({ code, onInvite }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-[#0B1C5C] via-[#0A1640] to-black p-4 text-white shadow-soft sm:p-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15">
        <Gift size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold">Invite friends</p>
        <p className="mt-0.5 truncate text-sm text-white/60">
          Your code: <span className="font-mono font-semibold text-white">{code}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onInvite}
        className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-navy transition-transform hover:-translate-y-0.5"
      >
        Invite
      </button>
    </div>
  );
}
