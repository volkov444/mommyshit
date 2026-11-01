export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] bg-white/90 p-6 shadow-soft ring-1 ring-soft backdrop-blur sm:p-10">
      {children}
    </div>
  );
}
