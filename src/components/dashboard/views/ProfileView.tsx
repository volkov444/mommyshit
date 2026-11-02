"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gift, Globe, Headset, KeyRound, LifeBuoy, LogOut, Pencil, UserRound } from "lucide-react";
import { ReferralBanner } from "@/components/dashboard/profile/ReferralBanner";
import { ProfileMenuList, type ProfileMenuItem } from "@/components/dashboard/profile/ProfileMenuList";
import { EditProfileSheet } from "@/components/dashboard/profile/EditProfileSheet";
import { ChangePasswordSheet } from "@/components/dashboard/profile/ChangePasswordSheet";
import { LanguageSheet } from "@/components/dashboard/profile/LanguageSheet";
import { InviteFriendSheet } from "@/components/dashboard/profile/InviteFriendSheet";
import { CustomerServiceSheet } from "@/components/dashboard/profile/CustomerServiceSheet";
import { HelpCenterSheet } from "@/components/dashboard/profile/HelpCenterSheet";
import { useToast } from "@/components/dashboard/ToastProvider";
import { useUser } from "@/components/dashboard/UserProvider";
import { getOverviewStats } from "@/lib/dashboard/api";
import { formatCurrency } from "@/lib/format";
import { logout } from "@/lib/auth";

type SheetKey = "edit" | "password" | "language" | "invite" | "cs" | "help" | null;

const LANGUAGE_LABELS: Record<string, string> = {
  en: "EN · English",
};

const CARD = "rounded-3xl bg-white p-4 shadow-soft ring-1 ring-soft sm:p-5";

export function ProfileView() {
  const { user } = useUser();
  const toast = useToast();
  const router = useRouter();

  const [stats, setStats] = useState({ totalOrders: 0, completedOrders: 0, totalSpending: 0 });
  const [language, setLanguage] = useState("en");
  const [activeSheet, setActiveSheet] = useState<SheetKey>(null);

  useEffect(() => {
    getOverviewStats().then(setStats);
  }, []);

  async function handleLogout() {
    await logout();
    toast("Signed out. See you soon!", "success");
    router.replace("/login");
  }

  function close() {
    setActiveSheet(null);
  }

  const initial = user?.name.charAt(0).toUpperCase() ?? "?";
  const referralCode = user?.referralCode ?? "—";

  const menuItems: ProfileMenuItem[] = [
    {
      key: "invite",
      icon: Gift,
      title: "Invite a Friend",
      description: "Code, link & friends who joined",
      onClick: () => setActiveSheet("invite"),
    },
    {
      key: "edit",
      icon: UserRound,
      title: "Edit Profile",
      description: "Change your display name",
      onClick: () => setActiveSheet("edit"),
    },
    {
      key: "password",
      icon: KeyRound,
      title: "Change Password",
      description: "Keep your account secure",
      onClick: () => setActiveSheet("password"),
    },
    {
      key: "language",
      icon: Globe,
      title: "Language",
      description: LANGUAGE_LABELS[language],
      onClick: () => setActiveSheet("language"),
    },
    {
      key: "cs",
      icon: Headset,
      title: "Customer Service",
      description: "Report an issue or get help",
      onClick: () => setActiveSheet("cs"),
    },
    {
      key: "help",
      icon: LifeBuoy,
      title: "Help Center",
      description: "Refunds, how-to & FAQ",
      onClick: () => setActiveSheet("help"),
    },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">My Account</h1>

      <div className={`${CARD} flex items-center gap-4`}>
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary text-xl font-extrabold text-white">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-navy">{user?.name ?? "—"}</p>
          <p className="truncate text-sm text-navy/55">{user?.email ?? "—"}</p>
        </div>
        <button
          type="button"
          onClick={() => setActiveSheet("edit")}
          aria-label="Edit profile"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-navy/45 ring-1 ring-soft transition-colors hover:bg-primary/10 hover:text-primary"
        >
          <Pencil size={16} />
        </button>
      </div>

      <div className={`${CARD} flex items-center justify-between gap-4`}>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">Available Balance</p>
          <p className="mt-1 truncate text-xl font-extrabold text-navy">{formatCurrency(user?.balance ?? 0)}</p>
        </div>
        <Link
          href="/dashboard/topup"
          className="shrink-0 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_-8px_rgb(40_117_251/0.7)] transition-all hover:-translate-y-0.5 hover:bg-deep"
        >
          + Top Up
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className={`${CARD} p-3.5! text-center sm:p-4!`}>
          <p className="text-lg font-extrabold text-navy sm:text-xl">{stats.totalOrders}</p>
          <p className="mt-1 text-[11px] font-semibold text-navy/50 sm:text-xs">Orders</p>
        </div>
        <div className={`${CARD} p-3.5! text-center sm:p-4!`}>
          <p className="text-lg font-extrabold text-navy sm:text-xl">{stats.completedOrders}</p>
          <p className="mt-1 text-[11px] font-semibold text-navy/50 sm:text-xs">Completed</p>
        </div>
        <div className={`${CARD} p-3.5! text-center sm:p-4!`}>
          <p className="truncate text-sm font-extrabold text-navy sm:text-xl">{formatCurrency(stats.totalSpending)}</p>
          <p className="mt-1 text-[11px] font-semibold text-navy/50 sm:text-xs">Spending</p>
        </div>
      </div>

      <ReferralBanner code={referralCode} onInvite={() => setActiveSheet("invite")} />

      <div className={`${CARD} p-2! sm:p-3!`}>
        <ProfileMenuList items={menuItems} />
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-3xl bg-white px-6 py-4 text-sm font-bold text-red-500 shadow-soft ring-1 ring-soft transition-colors hover:bg-red-50"
      >
        <LogOut size={16} />
        Logout
      </button>

      <EditProfileSheet open={activeSheet === "edit"} onClose={close} />
      <ChangePasswordSheet open={activeSheet === "password"} onClose={close} />
      <LanguageSheet open={activeSheet === "language"} onClose={close} selected={language} onSelect={setLanguage} />
      <InviteFriendSheet open={activeSheet === "invite"} onClose={close} code={referralCode} />
      <CustomerServiceSheet open={activeSheet === "cs"} onClose={close} />
      <HelpCenterSheet open={activeSheet === "help"} onClose={close} />
    </div>
  );
}
