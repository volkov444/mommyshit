// Server-side proxy for the admin "Test Koneksi" action on the Supplier page.
// Runs the real balance check against a supplier's API (e.g. VAK-SMS) so the
// secret key never has to be sent from the browser to a third-party origin,
// and so the request isn't blocked by CORS.

import { VAKSMS_MIRRORS, extractVakSmsError, isVakSmsLike, normalizeBase } from "@/lib/admin/vaksmsClient";

async function tryBalanceCheck(baseUrl: string, apiKey: string): Promise<{ ok: true; balance: number } | { ok: false; message: string } | null> {
  try {
    const res = await fetch(`${normalizeBase(baseUrl)}/api/getBalance?apiKey=${encodeURIComponent(apiKey)}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json().catch(() => null);
    if (data === null) return null;
    if (data && typeof data === "object" && typeof (data as Record<string, unknown>).balance === "number") {
      return { ok: true, balance: (data as Record<string, unknown>).balance as number };
    }
    const errorMessage = extractVakSmsError(data);
    if (errorMessage) return { ok: false, message: errorMessage };
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const apiUrl = typeof body?.apiUrl === "string" ? body.apiUrl : "";
  const apiKey = typeof body?.apiKey === "string" ? body.apiKey : "";

  if (!apiUrl.trim() || !apiKey.trim()) {
    return Response.json({ ok: false, message: "API URL dan API Key wajib diisi." });
  }

  const candidates = isVakSmsLike(apiUrl)
    ? [...new Set([normalizeBase(apiUrl), ...VAKSMS_MIRRORS])]
    : [normalizeBase(apiUrl)];

  for (const base of candidates) {
    const result = await tryBalanceCheck(base, apiKey.trim());
    if (result) return Response.json(result);
  }

  return Response.json({ ok: false, message: "Tidak dapat terhubung ke server supplier. Periksa API URL atau coba lagi." });
}
