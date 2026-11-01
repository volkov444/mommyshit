import { AdminPricingDetailView } from "@/components/admin/views/AdminPricingDetailView";

export default async function AdminPricingDetailPage({ params }: PageProps<"/admin/pricing/[countryCode]">) {
  const { countryCode } = await params;
  return <AdminPricingDetailView countryCode={countryCode} />;
}
