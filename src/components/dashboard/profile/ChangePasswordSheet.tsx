"use client";

import { useState } from "react";
import { Sheet } from "./Sheet";
import { PasswordField } from "@/components/auth/PasswordField";
import { useToast } from "@/components/dashboard/ToastProvider";
import { changePassword } from "@/lib/dashboard/api";
import { validateConfirmPassword, validatePassword } from "@/lib/validation";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ChangePasswordSheet({ open, onClose }: Props) {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [nextError, setNextError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setCurrentError(null);
    setNextError(null);
    setConfirmError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSave() {
    const cErr = current ? null : "Enter your current password.";
    const nErr = validatePassword(next);
    const confErr = validateConfirmPassword(next, confirm);
    setCurrentError(cErr);
    setNextError(nErr);
    setConfirmError(confErr);
    if (cErr || nErr || confErr) return;

    setSaving(true);
    const result = await changePassword(current, next);
    setSaving(false);
    if (result.ok) {
      toast("Password updated successfully.", "success");
      handleClose();
    } else {
      toast(result.message, "error");
    }
  }

  return (
    <Sheet open={open} onClose={handleClose} title="Change Password" description="Keep your account secure.">
      <div className="space-y-5">
        <PasswordField
          id="ps-current"
          label="Current Password"
          autoComplete="current-password"
          value={current}
          onChange={setCurrent}
          onBlur={() => setCurrentError(current ? null : "Enter your current password.")}
          error={currentError}
        />
        <PasswordField
          id="ps-new"
          label="New Password"
          autoComplete="new-password"
          value={next}
          onChange={setNext}
          onBlur={() => setNextError(validatePassword(next))}
          error={nextError}
          showStrength
        />
        <PasswordField
          id="ps-confirm"
          label="Confirm New Password"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          onBlur={() => setConfirmError(validateConfirmPassword(next, confirm))}
          error={confirmError}
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-8px_rgb(40_117_251/0.7)] transition-all hover:-translate-y-0.5 hover:bg-deep disabled:pointer-events-none disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Password"}
        </button>
      </div>
    </Sheet>
  );
}
