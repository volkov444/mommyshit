import { logActivity } from "./activityLogStore";
import { seedPromotions } from "./seedData";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Promotion, ReferralUsage } from "./types";

const STORAGE_KEY = "bluffy_demo_promotions";

function readStore(): Promotion[] {
  if (typeof window === "undefined") return seedPromotions;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Promotion[];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedPromotions));
    return seedPromotions;
  } catch {
    return seedPromotions;
  }
}

function writeStore(promotions: Promotion[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(promotions));
  } catch {
    // storage unavailable — demo data is best-effort
  }
}

export function getPromotions(): Promotion[] {
  return readStore();
}

export function addPromotion(promotion: Omit<Promotion, "id" | "usageCount">, actorId: string, actorName: string): Promotion {
  const promotions = readStore();
  const full: Promotion = { ...promotion, id: `promo_${Date.now().toString(36)}`, usageCount: 0 };
  writeStore([...promotions, full]);
  logActivity({ actorId, actorName, action: `Menambahkan promo ${full.code}`, targetType: "promotion", targetId: full.id });
  return full;
}

export function updatePromotion(id: string, patch: Partial<Omit<Promotion, "id">>, actorId: string, actorName: string): Promotion | undefined {
  const promotions = readStore();
  const idx = promotions.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  const updated = { ...promotions[idx], ...patch };
  const next = [...promotions];
  next[idx] = updated;
  writeStore(next);
  logActivity({ actorId, actorName, action: `Memperbarui promo ${updated.code}`, targetType: "promotion", targetId: id });
  return updated;
}

export function deletePromotion(id: string, actorId: string, actorName: string): void {
  const promotions = readStore();
  const target = promotions.find((p) => p.id === id);
  writeStore(promotions.filter((p) => p.id !== id));
  if (target) logActivity({ actorId, actorName, action: `Menghapus promo ${target.code}`, targetType: "promotion", targetId: id });
}

// Referral usages are real (see supabase/referrals_schema.sql) — every row
// is written by the handle_new_user signup trigger, atomically with the
// referrer's bonus; nothing here ever inserts one.
type ReferralUsageRow = { id: string; referrer_user_id: string; referred_user_id: string; bonus_amount: number; date: string };

export async function getReferralUsages(): Promise<ReferralUsage[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("referral_usages")
    .select("id, referrer_user_id, referred_user_id, bonus_amount, date")
    .order("date", { ascending: false });
  if (error || !data) return [];
  return (data as ReferralUsageRow[]).map((row) => ({
    id: row.id,
    referrerUserId: row.referrer_user_id,
    referredUserId: row.referred_user_id,
    bonusAmount: row.bonus_amount,
    date: row.date,
  }));
}
