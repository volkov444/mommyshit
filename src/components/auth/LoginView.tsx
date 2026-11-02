"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HomeAuthRedirect } from "@/components/HomeAuthRedirect";
import { AuthShell } from "./AuthShell";
import { AuthCard } from "./AuthCard";
import { AuthField } from "./AuthField";
import { PasswordField } from "./PasswordField";
import { AuthButton } from "./AuthButton";
import { GoogleButton } from "./GoogleButton";
import { Checkbox } from "./Checkbox";
import { Alert } from "./Alert";
import { login, completeAuthSession } from "@/lib/auth";
import { validateEmail, validatePassword } from "@/lib/validation";
import { assets } from "@/lib/site";

const JUST_REGISTERED_KEY = "bluffy_just_registered";

export function LoginView() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [justRegistered, setJustRegistered] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(JUST_REGISTERED_KEY)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of an external store (sessionStorage) on mount, not a render-triggered sync
        setJustRegistered(true);
        sessionStorage.removeItem(JUST_REGISTERED_KEY);
      }
    } catch {
      // sessionStorage unavailable — skip the welcome banner
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    setFormError(null);
    if (eErr || pErr) return;

    setLoading(true);
    const result = await login({ email, password });
    setLoading(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    completeAuthSession(result.session);
    setSuccess(true);
    setTimeout(() => router.push(result.session.role === "admin" ? "/admin" : "/dashboard"), 900);
  }

  return (
    <>
      <HomeAuthRedirect />
      <AuthShell
      mascot="wave"
      asideTitle="Simple. Secure. Bluffy."
      asideText="Everything you need to manage virtual numbers, in one simple place."
    >
      <AuthCard>
        <div className="mb-7 flex items-center gap-3 lg:hidden">
          <Image
            src={assets.wave.src}
            width={assets.wave.width}
            height={assets.wave.height}
            alt="Bluffy waving hello"
            className="h-14 w-14 object-contain"
          />
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
          Welcome back!
        </h1>
        <p className="mt-2 text-navy/65">Sign in to your Bluffy account</p>

        {justRegistered && (
          <div className="mt-6">
            <Alert tone="success">Account created! Please sign in.</Alert>
          </div>
        )}

        {success ? (
          <div className="mt-6">
            <Alert tone="success">Signed in! Redirecting you now…</Alert>
          </div>
        ) : (
          <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
            {formError && <Alert tone="error">{formError}</Alert>}

            <AuthField
              id="email"
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              onBlur={() => setEmailError(validateEmail(email))}
              error={emailError}
            />

            <div>
              <PasswordField
                id="password"
                label="Password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={setPassword}
                onBlur={() => setPasswordError(validatePassword(password))}
                error={passwordError}
              />
              <div className="mt-3 flex items-center justify-between">
                <Checkbox id="remember" checked={remember} onChange={setRemember}>
                  Remember me
                </Checkbox>
                <button
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="text-sm font-semibold text-primary hover:text-deep"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <AuthButton loading={loading}>Sign In</AuthButton>

            <div className="flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-soft" />
              <span className="text-xs font-bold uppercase tracking-wider text-navy/40">Or</span>
              <span className="h-px flex-1 bg-soft" />
            </div>

            <GoogleButton />
          </form>
        )}

        <p className="mt-7 text-center text-sm text-navy/65">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-primary hover:text-deep">
            Create an account
          </Link>
        </p>

      </AuthCard>
      </AuthShell>
    </>
  );
}
