"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { AuthCard } from "./AuthCard";
import { Alert } from "./Alert";
import { getActiveAuthSession, completeAuthSession } from "@/lib/auth";

export function AuthCallbackView() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Supabase's browser client parses the ?code=... it was redirected
    // back with and exchanges it for a session automatically on load —
    // this just polls briefly for that to land before giving up.
    async function finish() {
      for (let attempt = 0; attempt < 10; attempt++) {
        const result = await getActiveAuthSession();
        if (cancelled) return;

        if (result?.ok) {
          completeAuthSession(result.session);
          router.replace(result.session.role === "admin" ? "/admin" : "/dashboard");
          return;
        }
        if (result && !result.ok) {
          setError(result.message);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      if (!cancelled) setError("We couldn't finish signing you in. Please try again.");
    }

    finish();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <AuthShell mascot="wave" asideTitle="Simple. Secure. Bluffy." asideText="Everything you need to manage virtual numbers, in one simple place.">
      <AuthCard>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">Signing you in…</h1>
        <p className="mt-2 text-navy/65">Just a moment while we finish connecting your account.</p>

        <div className="mt-7">
          {error ? (
            <>
              <Alert tone="error">{error}</Alert>
              <a href="/login" className="mt-4 inline-block text-sm font-semibold text-primary hover:text-deep">
                Back to sign in
              </a>
            </>
          ) : (
            <div className="flex items-center gap-2.5 text-navy/60">
              <Loader2 size={18} className="animate-spin" />
              <span>Completing sign-in…</span>
            </div>
          )}
        </div>
      </AuthCard>
    </AuthShell>
  );
}
