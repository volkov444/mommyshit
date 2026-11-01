import type { Metadata } from "next";
import { BuyNumberView } from "@/components/dashboard/views/BuyNumberView";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Buy Virtual Numbers — ${site.name}`,
};

export default function BuyNumberPage() {
  return <BuyNumberView />;
}
