"use client";

import { useEffect, useState } from "react";
import { Sheet } from "./Sheet";
import { AuthField } from "@/components/auth/AuthField";
import { useToast } from "@/components/dashboard/ToastProvider";
import { useUser } from "@/components/dashboard/UserProvider";
import { updateProfile } from "@/lib/dashboard/api";
import { validateName } from "@/lib/validation";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function EditProfileSheet({ open, onClose }: Props) {
  const { user, updateUser } = useUser();
  const toast = useToast();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync of the form field from the loaded user record when the sheet opens, not a render-triggered loop
      setName(user.name);
      setError(null);
    }
  }, [open, user]);

  async function handleSave() {
    const err = validateName(name);
    setError(err);
    if (err) return;

    setSaving(true);
    const result = await updateProfile({ name });
    setSaving(false);
    if (result.ok) {
      updateUser({ name });
      toast("Display name updated successfully.", "success");
      onClose();
    } else {
      toast(result.message, "error");
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Edit Profile" description="Change your account's display name.">
      <div className="space-y-5">
        <AuthField
          id="display-name"
          label="Display Name"
          value={name}
          onChange={setName}
          onBlur={() => setError(validateName(name))}
          error={error}
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-8px_rgb(40_117_251/0.7)] transition-all hover:-translate-y-0.5 hover:bg-deep disabled:pointer-events-none disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </Sheet>
  );
}
