import type { Metadata } from "next";
import { TopUpView } from "@/components/dashboard/views/TopUpView";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Top Up — ${site.name}`,
};

export default function TopUpPage() {
  return <TopUpView />;
}
