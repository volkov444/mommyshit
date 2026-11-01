import { Globe, ShieldCheck, Zap } from "lucide-react";
import { Reveal } from "./Reveal";

const items = [
  { icon: Globe, title: "Multiple Countries", text: "Explore virtual numbers from different countries." },
  { icon: Zap, title: "Simple Activation", text: "Choose and activate a number in moments." },
  { icon: ShieldCheck, title: "Transparent Pricing", text: "See pricing clearly before you order." },
];

export function Highlights() {
  return (
    <section aria-label="Highlights" className="relative z-10 -mt-16 px-5 sm:px-6 lg:-mt-20">
      <ul className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
        {items.map(({ icon: Icon, title, text }, i) => (
          <Reveal as="li" key={title} delay={i * 0.1}>
            <div className="group flex h-full items-center gap-4 rounded-3xl bg-white p-5 shadow-soft ring-1 ring-soft/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift sm:flex-col sm:items-start sm:gap-5 sm:p-7">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-deep text-white transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                <Icon size={22} />
              </span>
              <div>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-navy/60">{text}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
