"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LifeBuoy, LogOut, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/cn";
import { adminNav } from "@/lib/admin/nav";
import { useToast } from "@/components/dashboard/ToastProvider";

type Props = {
  open: boolean;
  onClose: () => void;
};

// Left-edge slide-in drawer for admin nav on mobile — 12 menu items don't fit
// a bottom tab bar the way the 5-item user dashboard nav does, so this is a
// deliberately different mobile pattern from MobileNav.
export function AdminMobileDrawer({ open, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  function handleLogout() {
    onClose();
    toast("Berhasil keluar. Sampai jumpa lagi!", "success");
    router.push("/login");
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] md:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex h-full w-[82%] max-w-xs flex-col bg-white p-4 shadow-lift"
          >
            <div className="flex items-center justify-between px-1 pb-2 pt-1">
              <Logo compact />
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup menu"
                className="grid h-9 w-9 place-items-center rounded-full text-navy/50 transition-colors hover:bg-canvas"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
              {adminNav.map((item) => {
                const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
                      active ? "bg-primary text-white" : "text-navy/65 hover:bg-primary/10 hover:text-primary",
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="space-y-1 border-t border-soft pt-3">
              <Link
                href="/admin/support"
                onClick={onClose}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-navy/65 transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <LifeBuoy size={18} />
                Bantuan
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
              >
                <LogOut size={18} />
                Keluar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
