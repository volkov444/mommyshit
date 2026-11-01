// Shared helpers for the admin VAK-SMS server routes (test-connection,
// vaksms-catalog). VAK-SMS's gateway returns two different error envelope
// shapes depending on which endpoint you hit: the legacy `{error: "..."}`
// form, and a newer NestJS-style `{statusCode, code, message}` form (seen
// live on getCountryList) — both are handled here so neither route
// mistakes an error response for real data.

export const VAKSMS_MIRRORS = ["https://vak-sms.com", "https://moresms.net", "https://vaksms.ru"];

const KNOWN_ERRORS: Record<string, string> = {
  apiKeyNotFound: "Kunci API tidak valid atau tidak ditemukan.",
  badBalance: "Kunci API tidak valid atau tidak ditemukan.",
  noMoney: "Saldo akun supplier kosong.",
  UserNotFound: "Kunci API tidak valid atau tidak ditemukan.",
};

export function isVakSmsLike(url: string): boolean {
  return /vak-?sms|moresms/i.test(url);
}

export function normalizeBase(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export function extractVakSmsError(data: unknown): string | null {
  const rec = asRecord(data);
  if (!rec) return null;
  if (typeof rec.error === "string") {
    return KNOWN_ERRORS[rec.error] ?? `Supplier merespons dengan error: ${rec.error}`;
  }
  if (typeof rec.statusCode === "number" && rec.statusCode >= 400) {
    const code = typeof rec.code === "string" ? rec.code : undefined;
    if (code && KNOWN_ERRORS[code]) return KNOWN_ERRORS[code];
    const message = typeof rec.message === "string" ? rec.message : undefined;
    return message ? `Supplier merespons dengan error: ${message}` : "Supplier menolak permintaan.";
  }
  return null;
}

// Candidate base URLs to try in order — a configured VAK-SMS-like URL plus
// its known mirrors (vak-sms.com is blocked from some regions), same
// fallback behavior the catalog/test-connection routes already use.
export function candidateBases(apiUrl: string): string[] {
  return isVakSmsLike(apiUrl) ? [...new Set([normalizeBase(apiUrl), ...VAKSMS_MIRRORS])] : [normalizeBase(apiUrl)];
}

export async function vaksmsGet(base: string, path: string, timeoutMs = 10000): Promise<unknown> {
  try {
    const res = await fetch(`${base}${path}`, {
      method: "GET",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}

// getNumber/getSmsCode/setStatus response shapes aren't fully confirmed
// from public docs (the real docs page is JS-rendered and couldn't be
// scraped) — these try every plausible key name seen across VAK-SMS client
// wrappers rather than assuming one, so a differently-shaped real response
// still gets picked up instead of silently failing.
export function extractPhoneNumber(data: unknown): string | null {
  const rec = asRecord(data);
  if (!rec) return null;
  const v = firstString(rec, ["tel", "phone", "number", "phoneNumber"]);
  return v ?? null;
}

export function extractActivationId(data: unknown): string | null {
  const rec = asRecord(data);
  if (!rec) return null;
  const v = firstString(rec, ["idNum", "id", "activationId", "orderId"]);
  return v ?? null;
}

export function extractSmsCode(data: unknown): string | null {
  const rec = asRecord(data);
  if (!rec) return null;
  const v = firstString(rec, ["smsCode", "code", "sms"]);
  return v ?? null;
}

function firstString(rec: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number") return String(v);
  }
  return undefined;
}
