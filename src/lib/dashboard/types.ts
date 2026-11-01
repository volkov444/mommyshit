export type OrderStatus = "pending" | "active" | "completed" | "cancelled" | "failed";
export type TransactionStatus = "completed" | "pending" | "failed";

export type Country = {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
};

export type Service = {
  id: string;
  name: string;
  icon: string;
  description: string;
  active: boolean;
  order: number;
};

export type OrderStatusEvent = {
  status: OrderStatus;
  at: string;
  note?: string;
};

export type Order = {
  id: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  countryCode: string;
  countryName: string;
  countryFlag: string;
  phoneNumber: string;
  price: number;
  supplierPrice: number;
  otp: string | null;
  status: OrderStatus;
  createdAt: string;
  statusHistory: OrderStatusEvent[];
};

export type TransactionType = "deposit" | "purchase" | "refund" | "adjustment";

export type Transaction = {
  id: string;
  userId: string;
  type: TransactionType;
  description: string;
  amount: number;
  status: TransactionStatus;
  date: string;
};

export type UserRole = "user" | "admin";
export type UserStatus = "active" | "blocked";

export type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  joinedAt: string;
  balance: number;
  referralCode: string;
  role: UserRole;
  status: UserStatus;
};

export type PriceTier = {
  price: number;
  stock: number;
};

export type CountryWithTiers = Country & {
  tiers: PriceTier[];
  totalStock: number;
  cheapestPrice: number;
};

export type PaymentMethod = {
  id: string;
  label: string;
  description: string;
  icon: string;
  feeFlat: number;
};
