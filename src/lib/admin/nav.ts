import {
  Gift,
  Globe,
  Headset,
  LayoutGrid,
  LifeBuoy,
  ListOrdered,
  LogOut,
  Receipt,
  Server,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";

export const adminNav = [
  { label: "Dashboard", href: "/admin", icon: LayoutGrid },
  { label: "Pengguna", href: "/admin/users", icon: Users },
  { label: "Deposit", href: "/admin/deposits", icon: Wallet },
  { label: "Transaksi", href: "/admin/transactions", icon: Receipt },
  { label: "Pesanan", href: "/admin/orders", icon: ShoppingBag },
  { label: "Layanan", href: "/admin/services", icon: ListOrdered },
  { label: "Negara & Harga", href: "/admin/pricing", icon: Globe },
  { label: "Supplier", href: "/admin/suppliers", icon: Server },
  { label: "Promo & Referral", href: "/admin/promotions", icon: Gift },
  { label: "Customer Service", href: "/admin/support", icon: Headset },
  { label: "Laporan", href: "/admin/reports", icon: Receipt },
  { label: "Pengaturan", href: "/admin/settings", icon: Settings },
] as const;

export const adminNavFooter = [
  { label: "Bantuan", href: "/admin/support", icon: LifeBuoy },
  { label: "Keluar", href: "/login", icon: LogOut },
] as const;
