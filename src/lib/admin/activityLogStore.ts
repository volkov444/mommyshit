import { seedActivityLog } from "./seedData";
import type { AdminActivityLogEntry } from "./types";

const STORAGE_KEY = "bluffy_demo_activity_log";
// Hard cap so this store can't grow forever — localStorage has a ~5MB
// per-origin quota shared by every demo store, and writeStore() below
// silently swallows a QuotaExceededError (best-effort demo persistence),
// so an uncapped log can quietly fill the quota and make every OTHER
// store's writes fail too, with no visible error anywhere.
const MAX_ENTRIES = 500;

function readStore(): AdminActivityLogEntry[] {
  if (typeof window === "undefined") return seedActivityLog;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AdminActivityLogEntry[];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedActivityLog));
    return seedActivityLog;
  } catch {
    return seedActivityLog;
  }
}

function writeStore(entries: AdminActivityLogEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // storage unavailable — demo data is best-effort
  }
}

export function getActivityLog(): AdminActivityLogEntry[] {
  return [...readStore()].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export function logActivity(entry: Omit<AdminActivityLogEntry, "id" | "at">): void {
  const full: AdminActivityLogEntry = { ...entry, id: `act_${Date.now().toString(36)}`, at: new Date().toISOString() };
  writeStore([full, ...readStore()].slice(0, MAX_ENTRIES));
}
