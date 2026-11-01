// Orders, backed by Supabase (see supabase/orders_schema.sql and
// vaksms_numbers.sql). Order rows are only ever written by the
// purchase_number RPC (via src/app/api/numbers/purchase, keeping the VAK-SMS
// rental, balance debit and order insert atomic), the admin_update_order_status
// RPC for admin-initiated status changes, or cancel_own_order for user
// self-cancellation — nothing here inserts/updates a row directly.

import { getSupabaseClient } from "@/lib/supabase/client";
import type { Order, OrderStatus, OrderStatusEvent } from "@/lib/dashboard/types";

type OrderRow = {
  id: string;
  user_id: string;
  service_id: string;
  service_name: string;
  country_code: string;
  country_name: string;
  country_flag: string;
  phone_number: string;
  price: number;
  supplier_price: number;
  otp: string | null;
  status: OrderStatus;
  status_history: OrderStatusEvent[];
  created_at: string;
};

const COLUMNS =
  "id, user_id, service_id, service_name, country_code, country_name, country_flag, phone_number, price, supplier_price, otp, status, status_history, created_at";

// Used by getOrdersForUser — that one is fetched straight from the
// end-user dashboard with the browser's own Supabase client, so leaving
// supplier_price out of the select means Bluffy's cost price/margin never
// reaches the browser at all (visible in DevTools otherwise), not just
// something the UI happens to not render. getAllOrders (admin-only) keeps
// the full COLUMNS since the admin order views do show supplier cost/profit.
const USER_COLUMNS =
  "id, user_id, service_id, service_name, country_code, country_name, country_flag, phone_number, price, otp, status, status_history, created_at";

type UserOrderRow = Omit<OrderRow, "supplier_price">;

function fromUserRow(row: UserOrderRow): Order {
  return {
    id: row.id,
    userId: row.user_id,
    serviceId: row.service_id,
    serviceName: row.service_name,
    countryCode: row.country_code,
    countryName: row.country_name,
    countryFlag: row.country_flag,
    phoneNumber: row.phone_number,
    price: row.price,
    supplierPrice: 0,
    otp: row.otp,
    status: row.status,
    createdAt: row.created_at,
    statusHistory: row.status_history,
  };
}

function fromRow(row: OrderRow): Order {
  return {
    id: row.id,
    userId: row.user_id,
    serviceId: row.service_id,
    serviceName: row.service_name,
    countryCode: row.country_code,
    countryName: row.country_name,
    countryFlag: row.country_flag,
    phoneNumber: row.phone_number,
    price: row.price,
    supplierPrice: row.supplier_price,
    otp: row.otp,
    status: row.status,
    createdAt: row.created_at,
    statusHistory: row.status_history,
  };
}

export async function getAllOrders(): Promise<Order[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("orders").select(COLUMNS).order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as unknown as OrderRow[]).map(fromRow);
}

export async function getOrdersForUser(userId: string): Promise<Order[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select(USER_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as unknown as UserOrderRow[]).map(fromUserRow);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, note?: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("admin_update_order_status", {
    p_order_id: orderId,
    p_status: status,
    p_note: note ?? null,
  });
  if (error) return false;
  return Boolean(data);
}
