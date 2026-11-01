"use client";

import { useEffect, useState } from "react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { getSession } from "@/lib/admin/session";
import { getUserById } from "@/lib/admin/usersStore";
import {
  getSiteSettings,
  updateGeneralSettings,
  updateWebsiteSettings,
  updateNotificationSettings,
  type GeneralSettings,
  type WebsiteSettings,
  type NotificationSettings,
  type SiteSettings,
} from "@/lib/admin/siteSettingsStore";
import type { User } from "@/lib/dashboard/types";
import { GeneralTab } from "./settings/GeneralTab";
import { WebsiteTab } from "./settings/WebsiteTab";
import { AccountTab } from "./settings/AccountTab";
import { NotificationsTab } from "./settings/NotificationsTab";

const DEFAULTS: SiteSettings = {
  general: { siteName: "Bluffy", logoUrl: "/logo.svg", description: "Virtual numbers made simple." },
  website: {
    landingHeadline: "Virtual Numbers Made Simple",
    contactEmail: "support@bluffy.app",
    contactPhone: "+62 812-0000-0000",
    supportHours: "Senin–Minggu, 08.00–22.00 WIB",
  },
  notifications: { newDeposit: true, newOrder: true, newTicket: true, lowStock: false },
};

const TABS = [
  { key: "general", label: "Umum" },
  { key: "website", label: "Website" },
  { key: "account", label: "Akun" },
  { key: "notifications", label: "Notifikasi" },
] as const;

export function AdminSettingsView() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("general");
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);

  useEffect(() => {
    const session = getSession();
    getSiteSettings().then((s) => setSettings(s ?? DEFAULTS));
    getUserById(session.userId).then((user) => setAdminUser(user ?? null));
  }, []);

  async function saveGeneral(value: GeneralSettings): Promise<boolean> {
    const session = getSession();
    const ok = await updateGeneralSettings(value, session.userId, session.name);
    if (ok) setSettings((prev) => (prev ? { ...prev, general: value } : prev));
    return ok;
  }

  async function saveWebsite(value: WebsiteSettings): Promise<boolean> {
    const session = getSession();
    const ok = await updateWebsiteSettings(value, session.userId, session.name);
    if (ok) setSettings((prev) => (prev ? { ...prev, website: value } : prev));
    return ok;
  }

  async function saveNotifications(value: NotificationSettings): Promise<boolean> {
    const session = getSession();
    const ok = await updateNotificationSettings(value, session.userId, session.name);
    if (ok) setSettings((prev) => (prev ? { ...prev, notifications: value } : prev));
    return ok;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">Pengaturan</h1>
        <p className="mt-1.5 text-navy/60">Semua tab tersimpan sungguhan dan dipakai bersama oleh semua admin.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              tab === t.key ? "bg-primary text-white" : "bg-white text-navy/60 ring-1 ring-soft hover:text-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <SectionCard>
        {!settings ? (
          <p className="py-8 text-center text-sm text-navy/50">Memuat...</p>
        ) : (
          <>
            {tab === "general" && <GeneralTab value={settings.general} onSave={saveGeneral} />}
            {tab === "website" && <WebsiteTab value={settings.website} onSave={saveWebsite} />}
            {tab === "account" && adminUser && (
              <AccountTab user={adminUser} onUpdated={(patch) => setAdminUser((prev) => (prev ? { ...prev, ...patch } : prev))} />
            )}
            {tab === "notifications" && <NotificationsTab value={settings.notifications} onSave={saveNotifications} />}
          </>
        )}
      </SectionCard>
    </div>
  );
}
