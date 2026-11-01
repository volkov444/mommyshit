import type { Metadata } from "next";
import { ProfileView } from "@/components/dashboard/views/ProfileView";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Profile — ${site.name}`,
};

export default function ProfilePage() {
  return <ProfileView />;
}
