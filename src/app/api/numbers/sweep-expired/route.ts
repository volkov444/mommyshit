// Lazily releases+refunds any of the caller's own orders that sat 'active'
// past the reservation window with no SMS ever received. The Buy Number
// page also runs a client-side timer that does this instantly while that
// tab stays open, but a user who buys a number and closes the tab (or
// never comes back for 20 minutes) would otherwise leave that order stuck
// 'active' forever with no refund — this route is the self-healing path:
// called opportunistically every time the user's orders are fetched (see
// getOrders/getActiveOrders/getOverviewStats in src/lib/dashboard/api.ts),
// so it catches up the moment they next look at their orders, from any
// device/tab, regardless of whether the original tab is still around.

import { extractBearerToken } from "@/lib/supabase/authenticateRequest";
import { getSupabaseServerClient, getSupabaseUserClient } from "@/lib/supabase/server";
import { candidateBases, vaksmsGet } from "@/lib/admin/vaksmsClient";

// Mirrors ORDER_EXPIRY_MS in BuyNumberView.tsx — duplicated rather than
// shared since that one lives in a client component this server route
// can't import from.
const ORDER_EXPIRY_MS = 20 * 60 * 1000;

export async function POST(request: Request) {
  const token = extractBearerToken(request);
  if (!token) {
    return Response.json({ ok: false });
  }

  const admin = getSupabaseServerClient();
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) {
    return Response.json({ ok: false });
  }

  const cutoff = new Date(Date.now() - ORDER_EXPIRY_MS).toISOString();
  const { data: staleOrders } = await admin
    .from("orders")
    .select("id, supplier_order_id")
    .eq("user_id", userData.user.id)
    .in("status", ["pending", "active"])
    .is("otp", null)
    .lt("created_at", cutoff);

  if (!staleOrders || staleOrders.length === 0) {
    return Response.json({ ok: true, expiredCount: 0 });
  }

  const apiKey = process.env.VAKSMS_API_KEY;
  const apiUrl = process.env.VAKSMS_API_URL ?? "https://vak-sms.com";
  const userClient = getSupabaseUserClient(token);
  let newBalance: number | undefined;
  let expiredCount = 0;

  for (const order of staleOrders) {
    if (order.supplier_order_id && apiKey) {
      for (const base of candidateBases(apiUrl)) {
        const released = await vaksmsGet(base, `/api/setStatus?apiKey=${encodeURIComponent(apiKey)}&idNum=${encodeURIComponent(order.supplier_order_id)}&status=end`);
        if (released !== null) break;
      }
    }

    const { data } = await userClient.rpc("cancel_own_order", { p_order_id: order.id });
    const result = Array.isArray(data) ? data[0] : data;
    if (result?.ok) {
      expiredCount++;
      if (result.new_balance !== undefined && result.new_balance !== null) newBalance = result.new_balance;
    }
  }

  return Response.json({ ok: true, expiredCount, newBalance });
}
