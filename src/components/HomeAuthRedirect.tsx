"use client";

// The landing page at "/" is static marketing content with no idea whether
// the visitor is logged in — so an already-authenticated user typing the
// bare domain would otherwise see the public homepage instead of going
// straight back into their dashboard. This renders nothing; it just checks
// for a real Supabase session on mount and redirects if one exists.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getActiveAuthSession } from "@/lib/auth";

export function HomeAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    getActiveAuthSession().then((result) => {
      if (cancelled || !result?.ok) return;
      router.replace(result.session.role === "admin" ? "/admin" : "/dashboard");
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
