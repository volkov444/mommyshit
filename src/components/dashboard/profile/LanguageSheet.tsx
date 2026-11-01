"use client";

import { Check } from "lucide-react";
import { Sheet } from "./Sheet";
import { cn } from "@/lib/cn";

const LANGUAGES = [{ code: "en", label: "English" }] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  selected: string;
  onSelect: (code: string) => void;
};

export function LanguageSheet({ open, onClose, selected, onSelect }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Language" description="Choose the app's display language.">
      <div className="space-y-2">
        {LANGUAGES.map((lang) => {
          const active = lang.code === selected;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                onSelect(lang.code);
                onClose();
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left ring-1 transition-colors",
                active ? "bg-primary/10 ring-primary/50" : "bg-canvas ring-soft hover:bg-primary/5",
              )}
            >
              <span className="font-semibold text-navy">{lang.label}</span>
              {active && <Check size={18} className="text-primary" />}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
