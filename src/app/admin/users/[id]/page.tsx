import { AdminUserDetailView } from "@/components/admin/views/AdminUserDetailView";

export default async function AdminUserDetailPage({ params }: PageProps<"/admin/users/[id]">) {
  const { id } = await params;
  return <AdminUserDetailView userId={id} />;
}
