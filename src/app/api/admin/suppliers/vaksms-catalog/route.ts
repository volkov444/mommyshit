// Server-side proxy for the admin "Lihat Katalog" read-only view on the
// Supplier page. Fetches a supplier's real country/service catalog so the
// response never has to pass through the browser to a third-party origin.
// Read-only reference data only — never used to populate the local
// Layanan / Negara & Harga stores or to feed the demo Buy Number flow.

import { VAKSMS_MIRRORS, extractVakSmsError, isVakSmsLike, normalizeBase } from "@/lib/admin/vaksmsClient";

async function tryFetchJson(base: string, path: string): Promise<unknown> {
  try {
    const res = await fetch(`${normalizeBase(base)}${path}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      signal: AbortSignal.timeout(10000),
    });
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const apiUrl = typeof body?.apiUrl === "string" ? body.apiUrl : "";
  const apiKey = typeof body?.apiKey === "string" ? body.apiKey : "";
  const action = body?.action === "stats" ? "stats" : "countries";
  const country = typeof body?.country === "string" ? body.country : "";

  if (!apiUrl.trim()) {
    return Response.json({ ok: false, message: "API URL wajib diisi." });
  }
  if (!apiKey.trim()) {
    return Response.json({ ok: false, message: "API Key wajib diisi." });
  }
  if (action === "stats" && !country.trim()) {
    return Response.json({ ok: false, message: "Pilih negara terlebih dahulu." });
  }

  if (action === "stats") {
    // The real breakdown VAK-SMS shows in its own dashboard (many price
    // tiers per service, not one aggregate number) lives at this internal
    // endpoint — found via the admin's own browser DevTools, confirmed live
    // to also accept the public API key as a query param (not documented,
    // not the same convention as the other endpoints below, but real):
    // GET /backend/service/stats?countryId=<cc>&bringTime=1200&apiKey=<key>
    // Response: [{ id, name, count, minPrice, apiPrice, available: [{count, price}, ...] }]
    const base = normalizeBase(apiUrl);
    const path = `/backend/service/stats?countryId=${encodeURIComponent(country.trim())}&bringTime=1200&apiKey=${encodeURIComponent(apiKey.trim())}`;
    const data = await tryFetchJson(base, path);
    if (Array.isArray(data)) {
      return Response.json({ ok: true, data });
    }
    const errorMessage = data !== null ? extractVakSmsError(data) : null;
    return Response.json({ ok: false, message: errorMessage ?? "Tidak dapat mengambil data harga dari supplier." });
  }

  const key = `apiKey=${encodeURIComponent(apiKey.trim())}`;
  const path = `/api/getCountryList?${key}`;

  const candidates = isVakSmsLike(apiUrl) ? [...new Set([normalizeBase(apiUrl), ...VAKSMS_MIRRORS])] : [normalizeBase(apiUrl)];

  for (const base of candidates) {
    const data = await tryFetchJson(base, path);
    if (data !== null) {
      const errorMessage = extractVakSmsError(data);
      if (errorMessage) return Response.json({ ok: false, message: errorMessage });
      return Response.json({ ok: true, data });
    }
  }

  return Response.json({ ok: false, message: "Tidak dapat mengambil data katalog dari supplier." });
}
