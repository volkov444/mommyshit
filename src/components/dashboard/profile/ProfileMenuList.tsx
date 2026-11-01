"use client";

import { ChevronRight } from "lucide-react";

type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

export type ProfileMenuItem = {
  key: string;
  icon: IconComponent;
  title: string;
  description: string;
  onClick: () => void;
};

export function ProfileMenuList({ items }: { items: ProfileMenuItem[] }) {
  return (
    <div className="divide-y divide-soft/70">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className="flex w-full items-center gap-3.5 px-2 py-3.5 text-left transition-colors hover:bg-canvas/60 sm:px-3"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Icon size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-navy">{item.title}</p>
              <p className="truncate text-xs text-navy/50">{item.description}</p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-navy/30" />
          </button>
        );
      })}
    </div>
  );
}
