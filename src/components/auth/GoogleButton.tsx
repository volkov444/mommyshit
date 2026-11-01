"use client";

import { useState } from "react";
import { loginWithGoogle } from "@/lib/auth";
import { Alert } from "./Alert";

export function GoogleButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await loginWithGoogle();
    // On success the browser is already navigating to Google — nothing
    // left to do here. Only a failure returns control to this component.
    if (!result.ok) {
      setError(result.message);
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-7 py-3.5 font-semibold text-navy ring-1 ring-soft transition-all hover:-translate-y-0.5 hover:bg-canvas disabled:opacity-60"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-[18px] w-[18px]">
          <path
            fill="#4285F4"
            d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3.01h3.89c2.27-2.09 3.56-5.17 3.56-8.82Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.89-3.01c-1.08.72-2.46 1.15-4.04 1.15-3.1 0-5.73-2.1-6.67-4.92H1.3v3.09C3.27 21.3 7.31 24 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.33 14.31a7.2 7.2 0 0 1 0-4.62V6.6H1.3a12 12 0 0 0 0 10.8l4.03-3.09Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.23 0 12 0 7.31 0 3.27 2.7 1.3 6.6l4.03 3.09C6.27 6.87 8.9 4.77 12 4.77Z"
          />
        </svg>
        {loading ? "Redirecting…" : "Continue with Google"}
      </button>
      {error && (
        <div className="mt-3">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
    </div>
  );
}
