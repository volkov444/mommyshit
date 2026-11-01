import type { Metadata } from "next";
import { LoginView } from "@/components/auth/LoginView";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Sign In — ${site.name}`,
  description: `Sign in to your ${site.name} account.`,
};

export default function LoginPage() {
  return <LoginView />;
}
