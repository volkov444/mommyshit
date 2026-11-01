"use client";

import { useState } from "react";
import { useToast } from "@/components/dashboard/ToastProvider";
import { PasswordField } from "@/components/auth/PasswordField";
import { updateUserName } from "@/lib/admin/usersStore";
import { getSession, setSession } from "@/lib/admin/session";
import { changePassword } from "@/lib/dashboard/api";
import { validateName, validatePassword, validateConfirmPassword } from "@/lib/validation";
import type { User } from "@/lib/dashboard/types";

type Props = {
  user: User;
  onUpdated: (patch: Partial<User>) => void;
};

export function AccountTab({ user, onUpdated }: Props) {
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [nextError, setNextError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    const err = validateName(name);
    setNameError(err);
    if (err) return;

    setSavingName(true);
    const ok = await updateUserName(user.id, name.trim());
    setSavingName(false);
    if (!ok) {
      toast("Gagal menyimpan nama.", "error");
      return;
    }
    setSession({ ...getSession(), name: name.trim() });
    onUpdated({ name: name.trim() });
    toast("Informasi akun tersimpan.", "success");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    const cErr = current ? null : "Masukkan password saat ini.";
    const nErr = validatePassword(next);
    const confErr = validateConfirmPassword(next, confirm);
    setCurrentError(cErr);
    setNextError(nErr);
    setConfirmError(confErr);
    if (cErr || nErr || confErr) return;

    setSavingPassword(true);
    const result = await changePassword(current, next);
    setSavingPassword(false);
    if (result.ok) {
      toast("Password berhasil diperbarui.", "success");
      setCurrent("");
      setNext("");
      setConfirm("");
    } else {
      toast(result.message, "error");
    }
  }

  return (
    <div className="space-y-8">
      <form className="space-y-4" onSubmit={handleSaveName}>
        <div>
          <label htmlFor="settings-admin-name" className="mb-1.5 block text-sm font-semibold text-navy">
            Nama Admin
          </label>
          <input
            id="settings-admin-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setNameError(validateName(name))}
            className="w-full rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy ring-1 ring-soft focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {nameError && <p className="mt-1.5 text-xs font-medium text-red-500">{nameError}</p>}
        </div>
        <div>
          <label htmlFor="settings-admin-email" className="mb-1.5 block text-sm font-semibold text-navy">
            Email
          </label>
          <input
            id="settings-admin-email"
            type="email"
            value={user.email}
            disabled
            className="w-full cursor-not-allowed rounded-xl bg-canvas px-4 py-2.5 text-sm text-navy/60 ring-1 ring-soft"
          />
        </div>
        <button
          type="submit"
          disabled={savingName}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgb(40_117_251/0.6)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {savingName ? "Menyimpan..." : "Simpan"}
        </button>
      </form>

      <form className="space-y-4 border-t border-soft pt-6" onSubmit={handleChangePassword}>
        <p className="text-sm font-bold text-navy">Ubah Password</p>
        <PasswordField
          id="settings-current-password"
          label="Password Saat Ini"
          autoComplete="current-password"
          value={current}
          onChange={setCurrent}
          onBlur={() => setCurrentError(current ? null : "Masukkan password saat ini.")}
          error={currentError}
        />
        <PasswordField
          id="settings-new-password"
          label="Password Baru"
          autoComplete="new-password"
          value={next}
          onChange={setNext}
          onBlur={() => setNextError(validatePassword(next))}
          error={nextError}
          showStrength
        />
        <PasswordField
          id="settings-confirm-password"
          label="Konfirmasi Password Baru"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          onBlur={() => setConfirmError(validateConfirmPassword(next, confirm))}
          error={confirmError}
        />
        <button
          type="submit"
          disabled={savingPassword}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgb(40_117_251/0.6)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {savingPassword ? "Menyimpan..." : "Ubah Password"}
        </button>
      </form>
    </div>
  );
}
