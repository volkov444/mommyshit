import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

type Props = {
  eyebrow: string;
  title: string;
  text: string;
  align?: "center" | "left";
  tone?: "light" | "dark";
};

export function SectionHeading({ eyebrow, title, text, align = "center", tone = "light" }: Props) {
  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
      )}
    >
      <span
        className={cn(
          "inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em]",
          tone === "light" ? "bg-primary/10 text-primary" : "bg-white/15 text-soft",
        )}
      >
        {eyebrow}
      </span>
      <h2
        className={cn(
          "mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl",
          tone === "light" ? "text-navy" : "text-white",
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          "mt-4 text-base leading-relaxed sm:text-lg",
          tone === "light" ? "text-navy/65" : "text-white/75",
        )}
      >
        {text}
      </p>
    </Reveal>
  );
}
