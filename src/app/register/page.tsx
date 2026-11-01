import type { Metadata } from "next";
import { RegisterView } from "@/components/auth/RegisterView";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Create Account — ${site.name}`,
  description: `Create your ${site.name} account.`,
};

export default function RegisterPage() {
  return <RegisterView />;
}
