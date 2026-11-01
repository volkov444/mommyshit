import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Logo } from "@/components/Logo";

export function AdminUnauthorizedView() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-soft/60 via-[#EEF3FE] to-canvas px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-soft ring-1 ring-soft">
        <div className="mb-5 flex justify-center">
          <Logo />
        </div>
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-red-50 text-red-500">
          <ShieldAlert size={28} />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-navy">Akses Ditolak</h1>
        <p className="mt-2 text-sm text-navy/60">
          Halaman ini khusus untuk Administrator. Akun Anda saat ini tidak memiliki izin untuk mengakses Admin Dashboard.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgb(40_117_251/0.6)] transition-opacity hover:opacity-90"
          >
            Kembali ke Dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-canvas px-5 py-3 text-sm font-bold text-navy ring-1 ring-soft transition-colors hover:bg-soft/60"
          >
            Masuk dengan akun lain
          </Link>
        </div>
      </div>
    </div>
  );
}
