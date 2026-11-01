"use client";

import { ArrowUp, AtSign, MessageCircle, Play } from "lucide-react";
import { navLinks, site } from "@/lib/site";
import { Logo } from "./Logo";

const socials = [
  { label: "Instagram", href: "https://instagram.com", icon: AtSign },
  { label: "YouTube", href: "https://youtube.com", icon: Play },
  { label: "Chat", href: "https://wa.me", icon: MessageCircle },
];

export function Footer() {
  return (
    <footer className="border-t border-soft/70 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <a href="#home" aria-label={`${site.name} home`}>
            <Logo />
          </a>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-navy/60">
            Virtual numbers made simple — one straightforward platform for
            SMS verification.
          </p>
        </div>

        <nav aria-label="Quick links">
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Quick Links</h2>
          <ul className="mt-4 space-y-2.5">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-sm text-navy/60 transition-colors hover:text-primary"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Social</h2>
          <ul className="mt-4 flex gap-3">
            {socials.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-11 w-11 place-items-center rounded-full bg-canvas text-deep ring-1 ring-soft transition-all hover:-translate-y-1 hover:bg-primary hover:text-white"
                >
                  <Icon size={18} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-soft/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-6 text-sm text-navy/55 sm:flex-row sm:px-6">
          <p>© {site.year} {site.name}. All rights reserved.</p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group inline-flex items-center gap-2 rounded-full bg-canvas px-4 py-2 font-semibold text-deep ring-1 ring-soft transition-all hover:bg-primary hover:text-white"
          >
            Back to Top
            <ArrowUp size={16} className="transition-transform group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
