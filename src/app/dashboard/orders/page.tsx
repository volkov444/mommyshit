import type { Metadata } from "next";
import { OrdersView } from "@/components/dashboard/views/OrdersView";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Orders — ${site.name}`,
};

export default function OrdersPage() {
  return <OrdersView />;
}
