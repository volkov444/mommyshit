// Site settings — a single shared row (see supabase/site_settings.sql) read
// and written by every admin, replacing the old per-browser
// "bluffy_demo_admin_settings" localStorage copy that only the saving
// admin's own browser ever saw and that never persisted for real.

import { getSupabaseClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLogStore";

export type GeneralSettings = {
  siteName: string;
  logoUrl: string;
  description: string;
};

export type WebsiteSettings = {
  landingHeadline: string;
  contactEmail: string;
  contactPhone: string;
  supportHours: string;
};

export type NotificationSettings = {
  newDeposit: boolean;
  newOrder: boolean;
  newTicket: boolean;
  lowStock: boolean;
};

export type SiteSettings = {
  general: GeneralSettings;
  website: WebsiteSettings;
  notifications: NotificationSettings;
};

type SiteSettingsRow = {
  site_name: string;
  logo_url: string;
  description: string;
  landing_headline: string;
  contact_email: string;
  contact_phone: string;
  support_hours: string;
  notify_new_deposit: boolean;
  notify_new_order: boolean;
  notify_new_ticket: boolean;
  notify_low_stock: boolean;
};

const COLUMNS =
  "site_name, logo_url, description, landing_headline, contact_email, contact_phone, support_hours, notify_new_deposit, notify_new_order, notify_new_ticket, notify_low_stock";

function fromRow(row: SiteSettingsRow): SiteSettings {
  return {
    general: { siteName: row.site_name, logoUrl: row.logo_url, description: row.description },
    website: {
      landingHeadline: row.landing_headline,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      supportHours: row.support_hours,
    },
    notifications: {
      newDeposit: row.notify_new_deposit,
      newOrder: row.notify_new_order,
      newTicket: row.notify_new_ticket,
      lowStock: row.notify_low_stock,
    },
  };
}

export async function getSiteSettings(): Promise<SiteSettings | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("site_settings").select(COLUMNS).eq("id", 1).maybeSingle();
  if (error || !data) return undefined;
  return fromRow(data as SiteSettingsRow);
}

export async function updateGeneralSettings(value: GeneralSettings, actorId: string, actorName: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ site_name: value.siteName, logo_url: value.logoUrl, description: value.description })
    .eq("id", 1);
  if (error) return false;
  logActivity({ actorId, actorName, action: "Memperbarui pengaturan umum situs", targetType: "settings" });
  return true;
}

export async function updateWebsiteSettings(value: WebsiteSettings, actorId: string, actorName: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      landing_headline: value.landingHeadline,
      contact_email: value.contactEmail,
      contact_phone: value.contactPhone,
      support_hours: value.supportHours,
    })
    .eq("id", 1);
  if (error) return false;
  logActivity({ actorId, actorName, action: "Memperbarui pengaturan website", targetType: "settings" });
  return true;
}

export async function updateNotificationSettings(value: NotificationSettings, actorId: string, actorName: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      notify_new_deposit: value.newDeposit,
      notify_new_order: value.newOrder,
      notify_new_ticket: value.newTicket,
      notify_low_stock: value.lowStock,
    })
    .eq("id", 1);
  if (error) return false;
  logActivity({ actorId, actorName, action: "Memperbarui preferensi notifikasi admin", targetType: "settings" });
  return true;
}
