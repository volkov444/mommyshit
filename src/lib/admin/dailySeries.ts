// Buckets real store records into a daily time series for the admin charts
// (Overview, Laporan) — replaces the old generateDailySeries() which drew
// fake hash-based numbers unrelated to anything in the stores.

export type DailyPoint = { date: string; value: number };

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function lastDays(days: number): string[] {
  const keys: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

export function dailyCount(dates: string[], days: number): DailyPoint[] {
  const counts = new Map<string, number>();
  for (const date of dates) counts.set(dayKey(date), (counts.get(dayKey(date)) ?? 0) + 1);
  return lastDays(days).map((date) => ({ date, value: counts.get(date) ?? 0 }));
}

export function dailySum(entries: { date: string; amount: number }[], days: number): DailyPoint[] {
  const sums = new Map<string, number>();
  for (const e of entries) sums.set(dayKey(e.date), (sums.get(dayKey(e.date)) ?? 0) + e.amount);
  return lastDays(days).map((date) => ({ date, value: Math.round((sums.get(date) ?? 0) * 100) / 100 }));
}
