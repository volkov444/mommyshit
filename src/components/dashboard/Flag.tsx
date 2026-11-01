import { cn } from "@/lib/cn";

type Props = {
  code: string;
  className?: string;
};

// Renders a real country flag via the flag-icons CSS sprite set instead of a
// Unicode flag emoji — emoji flags fall back to plain two-letter text on
// several platforms (notably Windows), so this keeps flags visually
// consistent everywhere regardless of system emoji font support.
export function Flag({ code, className }: Props) {
  return (
    <span
      className={cn("fi rounded-[3px] align-middle shadow-sm", `fi-${code.toLowerCase()}`, className)}
      role="img"
      aria-label={`${code} flag`}
    />
  );
}
