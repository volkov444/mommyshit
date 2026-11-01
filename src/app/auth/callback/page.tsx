import type { Metadata } from "next";
import { AuthCallbackView } from "@/components/auth/AuthCallbackView";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Signing In — ${site.name}`,
};

export default function AuthCallbackPage() {
  return <AuthCallbackView />;
}
