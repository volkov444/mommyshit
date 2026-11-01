import type { Country, PaymentMethod } from "./types";

export const countries: Country[] = [
  { code: "ID", name: "Indonesia", flag: "🇮🇩", dialCode: "+62" },
  { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", dialCode: "+65" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", dialCode: "+60" },
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91" },
  { code: "DE", name: "Germany", flag: "🇩🇪", dialCode: "+49" },
  { code: "FR", name: "France", flag: "🇫🇷", dialCode: "+33" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", dialCode: "+55" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", dialCode: "+84" },
];

// Which countries each service can currently issue numbers for. Mock data —
// swap for a real supplier catalogue lookup later.
export const serviceAvailability: Record<string, string[]> = {
  whatsapp: ["ID", "US", "GB", "SG", "MY", "IN", "BR"],
  telegram: ["ID", "US", "GB", "SG", "DE", "FR"],
  google: ["US", "GB", "DE", "FR", "IN"],
  facebook: ["ID", "US", "MY", "IN", "VN"],
  instagram: ["ID", "MY", "SG", "BR", "VN"],
  tiktok: ["ID", "VN", "MY", "SG"],
  discord: ["US", "GB", "DE", "FR"],
  amazon: ["US", "GB", "DE", "FR"],
};

export const paymentMethods: PaymentMethod[] = [
  { id: "oxapay", label: "Crypto (OxaPay)", description: "BTC, ETH, USDT, dan lainnya", icon: "Bitcoin", feeFlat: 0 },
];

export const quickTopUpAmounts = [0.63, 1.58, 3.16, 6.33, 15.82, 31.65];
