"use client";

import { useState } from "react";
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
import { register, completeAuthSession } from "@/lib/auth";
import {
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/validation";
import { assets } from "@/lib/site";

const JUST_REGISTERED_KEY = "bluffy_just_registered";

export function RegisterView() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [agree, setAgree] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [agreeError, setAgreeError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nErr = validateName(name);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const cErr = validateConfirmPassword(password, confirm);
    const aErr = agree ? null : "You must agree to the Terms of Service and Privacy Policy.";

    setNameError(nErr);
    setEmailError(eErr);
    setPasswordError(pErr);
    setConfirmError(cErr);
    setAgreeError(aErr);
    setFormError(null);
    if (nErr || eErr || pErr || cErr || aErr) return;

    setLoading(true);
    const result = await register({ name, email, password, referralCode: referralCode || undefined });
    setLoading(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    setSuccess(true);

    if (!result.session) {
      // Project has email confirmation turned on — the account exists but
      // can't sign in until the user clicks the link in their inbox.
      setNeedsConfirmation(true);
      return;
    }

    completeAuthSession(result.session);
    try {
      sessionStorage.setItem(JUST_REGISTERED_KEY, "1");
    } catch {
      // sessionStorage unavailable — the welcome banner just won't show
    }
    setTimeout(() => router.push("/dashboard"), 900);
  }

  return (
    <>
      <HomeAuthRedirect />
      <AuthShell
      mascot="happy"
      asideTitle="Simple. Secure. Bluffy."
      asideText="Everything you need to manage virtual numbers, in one simple place."
    >
      <AuthCard>
        <div className="mb-7 flex items-center gap-3 lg:hidden">
          <Image
            src={assets.happy.src}
            width={assets.happy.width}
            height={assets.happy.height}
            alt="Bluffy, bright-eyed and ready"
            className="h-14 w-14 object-contain"
          />
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
          Create your account
        </h1>
        <p className="mt-2 text-navy/65">Start using Bluffy today.</p>

        {success ? (
          <div className="mt-6">
            <Alert tone="success">
              {needsConfirmation
                ? "Account created! Check your email for a confirmation link before signing in."
                : "Account created! Taking you to your dashboard…"}
            </Alert>
          </div>
        ) : (
          <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
            {formError && <Alert tone="error">{formError}</Alert>}

            <AuthField
              id="name"
              label="Full name"
              autoComplete="name"
              placeholder="Jane Doe"
              value={name}
              onChange={setName}
              onBlur={() => setNameError(validateName(name))}
              error={nameError}
            />

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

            <PasswordField
              id="password"
              label="Password"
              autoComplete="new-password"
              placeholder="Create a password"
              value={password}
              onChange={setPassword}
              onBlur={() => setPasswordError(validatePassword(password))}
              error={passwordError}
              showStrength
            />

            <PasswordField
              id="confirm-password"
              label="Confirm password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirm}
              onChange={setConfirm}
              onBlur={() => setConfirmError(validateConfirmPassword(password, confirm))}
              error={confirmError}
            />

            <AuthField
              id="referral-code"
              label="Referral code (optional)"
              placeholder="e.g. REF1A2B3C4D"
              value={referralCode}
              onChange={setReferralCode}
            />

            <Checkbox id="agree" checked={agree} onChange={setAgree} error={agreeError}>
              I agree to the{" "}
              <a href="#" onClick={(e) => e.preventDefault()} className="font-semibold text-primary hover:text-deep">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" onClick={(e) => e.preventDefault()} className="font-semibold text-primary hover:text-deep">
                Privacy Policy
              </a>
            </Checkbox>

            <AuthButton loading={loading}>Create Account</AuthButton>

            <div className="flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-soft" />
              <span className="text-xs font-bold uppercase tracking-wider text-navy/40">Or</span>
              <span className="h-px flex-1 bg-soft" />
            </div>

            <GoogleButton />
          </form>
        )}

        <p className="mt-7 text-center text-sm text-navy/65">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:text-deep">
            Sign in
          </Link>
        </p>
      </AuthCard>
      </AuthShell>
    </>
  );
}
