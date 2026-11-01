// Country catalogue, backed by Supabase (see supabase/catalog_schema.sql)
// so every user/admin session sees the same list instead of a per-browser
// localStorage copy. Extensible at runtime: importing a supplier catalogue
// for a country Bluffy doesn't carry yet adds it here instead of being
// rejected.

import { getSupabaseClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLogStore";
import type { Country } from "@/lib/dashboard/types";

// Best-effort calling codes for common countries, used only to format the
// demo dummy phone number — cosmetic, so an unmapped country just falls
// back to a bare "+".
const DIAL_CODES: Record<string, string> = {
  AD: "+376", AE: "+971", AF: "+93", AL: "+355", AM: "+374", AO: "+244", AR: "+54", AT: "+43",
  AU: "+61", AZ: "+994", BA: "+387", BD: "+880", BE: "+32", BG: "+359", BH: "+973", BO: "+591",
  BR: "+55", BY: "+375", CA: "+1", CH: "+41", CL: "+56", CN: "+86", CO: "+57", CR: "+506",
  CY: "+357", CZ: "+420", DE: "+49", DK: "+45", DO: "+1", DZ: "+213", EC: "+593", EE: "+372",
  EG: "+20", ES: "+34", FI: "+358", FR: "+33", GB: "+44", GE: "+995", GH: "+233", GR: "+30",
  GT: "+502", HK: "+852", HN: "+504", HR: "+385", HU: "+36", ID: "+62", IE: "+353", IL: "+972",
  IN: "+91", IQ: "+964", IR: "+98", IS: "+354", IT: "+39", JM: "+1", JO: "+962", JP: "+81",
  KE: "+254", KG: "+996", KH: "+855", KR: "+82", KW: "+965", KZ: "+7", LA: "+856", LB: "+961",
  LK: "+94", LT: "+370", LV: "+371", LY: "+218", MA: "+212", MD: "+373", MM: "+95", MN: "+976",
  MX: "+52", MY: "+60", NG: "+234", NL: "+31", NO: "+47", NP: "+977", NZ: "+64", OM: "+968",
  PA: "+507", PE: "+51", PH: "+63", PK: "+92", PL: "+48", PT: "+351", PY: "+595", QA: "+974",
  RO: "+40", RS: "+381", RU: "+7", SA: "+966", SE: "+46", SG: "+65", SK: "+421", SN: "+221",
  TH: "+66", TJ: "+992", TN: "+216", TR: "+90", TW: "+886", TZ: "+255", UA: "+380", UG: "+256",
  US: "+1", UY: "+598", UZ: "+998", VE: "+58", VN: "+84", YE: "+967", ZA: "+27",
};

type CountryRow = { code: string; name: string; flag: string; dial_code: string };

function fromRow(row: CountryRow): Country {
  return { code: row.code, name: row.name, flag: row.flag, dialCode: row.dial_code };
}

export function flagFromCode(code: string): string {
  if (!/^[a-zA-Z]{2}$/.test(code)) return "🏳️";
  const points = code.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...points);
}

export function dialCodeFromCode(code: string): string {
  return DIAL_CODES[code.toUpperCase()] ?? "+";
}

export async function getCountries(): Promise<Country[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("countries").select("code, name, flag, dial_code").order("name");
  if (error || !data) return [];
  return data.map(fromRow);
}

export async function getCountryByCode(code: string): Promise<Country | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("countries")
    .select("code, name, flag, dial_code")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error || !data) return undefined;
  return fromRow(data);
}

export async function addCountry(country: Country, actorId: string, actorName: string): Promise<Country> {
  const existing = await getCountryByCode(country.code);
  if (existing) return existing;

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("countries")
    .insert({ code: country.code.toUpperCase(), name: country.name, flag: country.flag, dial_code: country.dialCode });
  if (error) throw new Error(error.message);

  logActivity({ actorId, actorName, action: `Menambahkan negara ${country.name} (${country.code})`, targetType: "pricing", targetId: country.code });
  return { ...country, code: country.code.toUpperCase() };
}
