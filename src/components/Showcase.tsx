import Image from "next/image";
import { assets } from "@/lib/site";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

const poses = [
  { label: "Happy", note: "Bright-eyed and ready", img: assets.happy, flip: false, tint: "from-soft/70 to-white" },
  { label: "Waving", note: "A friendly hello", img: assets.wave, flip: false, tint: "from-soft to-[#E8F0FF]" },
  { label: "Megaphone", note: "Spreading the word", img: assets.megaphone, flip: false, tint: "from-[#E8F0FF] to-soft/80" },
  { label: "Pointing Forward", note: "Let's go this way", img: assets.wave, flip: true, tint: "from-white to-soft/70" },
] as const;

export function Showcase() {
  return (
    <section id="showcase" className="relative overflow-hidden bg-white py-24 lg:py-32">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-soft to-transparent"
      />
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <SectionHeading
          eyebrow="Showcase"
          title="One Buddy, Many Moods."
          text="Meet the mascot in every pose — always the same friendly face."
        />

        <div className="mt-14 grid grid-cols-1 gap-5 min-[560px]:grid-cols-2 lg:grid-cols-4">
          {poses.map((p, i) => (
            <Reveal key={p.label} delay={i * 0.08} className={cn(i % 2 === 1 && "lg:translate-y-8")}>
              <figure
                className={cn(
                  "group relative flex h-full flex-col items-center overflow-hidden rounded-[2rem] bg-gradient-to-b p-6 pb-7 ring-1 ring-soft/70 transition-all duration-300 hover:-translate-y-2 hover:shadow-lift",
                  p.tint,
                )}
              >
                <div className="relative grid aspect-square w-full place-items-center">
                  <div
                    aria-hidden
                    className="absolute bottom-3 h-5 w-2/3 rounded-[50%] bg-deep/15 blur-md transition-all duration-300 group-hover:w-1/2 group-hover:opacity-60"
                  />
                  <div className={cn("relative w-4/5", p.flip && "-scale-x-100")}>
                    <Image
                      src={p.img.src}
                      width={p.img.width}
                      height={p.img.height}
                      alt={`${p.label} pose of the blue mascot`}
                      sizes="(min-width:1024px) 240px, (min-width:560px) 40vw, 80vw"
                      className="h-auto w-full object-contain transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-105"
                    />
                  </div>
                </div>
                <figcaption className="mt-4 text-center">
                  <p className="text-lg font-bold">{p.label}</p>
                  <p className="text-sm text-navy/60">{p.note}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
