import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Admin Dashboard — ${site.name}`,
  description: `Kelola seluruh aktivitas platform ${site.name}.`,
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
