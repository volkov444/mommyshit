import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Dashboard — ${site.name}`,
  description: `Manage your virtual numbers and account on ${site.name}.`,
};

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return <DashboardShell>{children}</DashboardShell>;
}
