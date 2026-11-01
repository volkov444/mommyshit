import { AdminTicketDetailView } from "@/components/admin/views/AdminTicketDetailView";

export default async function AdminTicketDetailPage({ params }: PageProps<"/admin/support/[id]">) {
  const { id } = await params;
  return <AdminTicketDetailView ticketId={id} />;
}
