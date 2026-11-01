import { LayoutGrid, ListOrdered, Smartphone, UserCircle, Wallet } from "lucide-react";

export const dashboardNav = [
  { label: "Overview", mobileLabel: "Home", href: "/dashboard", icon: LayoutGrid },
  { label: "Top Up", mobileLabel: "Top Up", href: "/dashboard/topup", icon: Wallet },
  { label: "Buy Number", mobileLabel: "Buy", href: "/dashboard/buy-number", icon: Smartphone },
  { label: "Orders", mobileLabel: "Orders", href: "/dashboard/orders", icon: ListOrdered },
  { label: "Profile", mobileLabel: "Profile", href: "/dashboard/profile", icon: UserCircle },
] as const;
