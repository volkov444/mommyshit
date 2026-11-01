import type { UserRole } from "@/lib/dashboard/types";

export type Role = UserRole;

export type Session = {
  userId: string;
  role: Role;
  name: string;
};

export type DepositStatus = "pending" | "success" | "failed" | "expired";

export type Deposit = {
  id: string;
  userId: string;
  amount: number;
  methodId: string;
  status: DepositStatus;
  createdAt: string;
};

export type AdminPriceTier = {
  id: string;
  serviceId: string;
  countryCode: string;
  supplierPrice: number;
  sellPrice: number;
  stock: number;
  active: boolean;
  supplierServiceCode: string | null;
};

export type SupplierConnectionStatus = "connected" | "disconnected";

export type Supplier = {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  active: boolean;
  connectionStatus: SupplierConnectionStatus;
  serviceCount: number;
  updatedAt: string;
};

export type PromotionType = "deposit" | "coupon";
export type DiscountType = "percent" | "flat";

export type Promotion = {
  id: string;
  type: PromotionType;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  active: boolean;
  usageCount: number;
  expiresAt: string | null;
};

export type ReferralUsage = {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  bonusAmount: number;
  date: string;
};

export type TicketStatus = "open" | "in_progress" | "resolved";

export type TicketReply = {
  author: "user" | "admin";
  message: string;
  at: string;
};

export type SupportTicket = {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  message: string;
  status: TicketStatus;
  createdAt: string;
  replies: TicketReply[];
};

export type AdminActivityLogEntry = {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  targetType?: string;
  targetId?: string;
  at: string;
};

export type AdminStatus =
  | DepositStatus
  | TicketStatus
  | "active"
  | "blocked"
  | "inactive"
  | "connected"
  | "disconnected";
