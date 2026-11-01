import Image from "next/image";
import { Check } from "lucide-react";
import { assets } from "@/lib/site";
import { Reveal } from "./Reveal";
import { Star } from "./Decor";

const points = ["Clear pricing before you order", "Simple, fast number activation", "SMS messages organized in one place"];

export function About() {
  return (
    <section id="about" className="mx-auto max-w-6xl px-5 py-24 sm:px-6 lg:py-32">
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
            Why Bluffy
          </span>
          <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Small Character.{" "}
            <span className="text-primary">Big Convenience.</span>
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-navy/65">
            Every verification deserves a straightforward experience. Bluffy
            brings virtual number access into one simple, friendly platform.
          </p>
          <ul className="mt-8 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-3 font-semibold">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-white">
                  <Check size={15} strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.15} className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative rounded-[2.5rem] bg-gradient-to-br from-soft to-white p-5 ring-1 ring-soft sm:p-7">
            <Star className="absolute -right-3 -top-3 h-9 w-9 text-primary" />
            <div className="overflow-hidden rounded-[2rem] shadow-lift ring-1 ring-white">
              <Image
                src={assets.hero.src}
                width={assets.hero.width}
                height={assets.hero.height}
                alt="Close-up of the fluffy blue mascot smiling"
                sizes="(min-width:1024px) 520px, 90vw"
                className="h-auto w-full transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div className="absolute -bottom-8 -left-3 w-40 rounded-3xl bg-white p-3 shadow-lift ring-1 ring-soft sm:-left-8 sm:w-52 sm:p-4">
              <Image
                src={assets.line.src}
                width={assets.line.width}
                height={assets.line.height}
                alt="Line-art sketch of the mascot with a megaphone"
                sizes="208px"
                className="h-auto w-full"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
