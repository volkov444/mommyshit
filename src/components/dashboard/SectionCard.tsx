import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
};

export function SectionCard({ children, className, title, description, action }: Props) {
  return (
    <div className={cn("rounded-3xl bg-white p-5 shadow-soft ring-1 ring-soft sm:p-7", className)}>
      {(title || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-lg font-extrabold tracking-tight text-navy">{title}</h2>}
            {description && <p className="mt-1 text-sm text-navy/55">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
