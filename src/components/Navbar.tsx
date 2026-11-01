"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { navLinks, site } from "@/lib/site";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
      <nav
        aria-label="Main"
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between rounded-full px-4 py-2.5 transition-all duration-300 sm:px-6",
          scrolled || open
            ? "bg-white/75 shadow-soft ring-1 ring-white/70 backdrop-blur-xl"
            : "bg-white/10 ring-1 ring-white/30 backdrop-blur-md",
        )}
      >
        <a href="#home" className="flex items-center gap-2" aria-label={`${site.name} home`}>
          <Logo />
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-navy/75 transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href="/login"
            className="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-navy/75 transition-colors hover:bg-primary/10 hover:text-primary sm:inline-block"
          >
            Log In
          </a>
          <a
            href="/register"
            className="group hidden rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-6px_rgb(40_117_251/0.6)] transition-all hover:-translate-y-0.5 hover:bg-deep sm:inline-block"
          >
            Get Started
          </a>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/70 text-navy ring-1 ring-soft transition-colors hover:bg-white md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-3xl bg-white/90 p-3 shadow-lift ring-1 ring-white backdrop-blur-xl md:hidden"
          >
            <ul className="flex flex-col">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-2xl px-4 py-3 text-base font-semibold text-navy transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-base font-semibold text-navy transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  Log In
                </a>
              </li>
              <li className="p-1 pt-2">
                <a
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl bg-primary py-3 text-center font-semibold text-white"
                >
                  Get Started
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
