import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { assets } from "@/lib/site";
import { Reveal } from "./Reveal";
import { Star } from "./Decor";

export function CTA() {
  return (
    <section id="contact" className="px-4 pb-24 sm:px-6 lg:pb-32">
      <Reveal>
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-deep to-navy px-7 py-16 text-center sm:px-14 lg:py-20 lg:text-left">
          <div
            aria-hidden
            className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(rgb(255 255 255 / .6) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
              maskImage: "linear-gradient(to right, #000, transparent 60%)",
              WebkitMaskImage: "linear-gradient(to right, #000, transparent 60%)",
            }}
          />
          <Star className="absolute left-8 top-8 h-6 w-6 text-white/70" />
          <Star className="absolute bottom-10 right-1/3 hidden h-5 w-5 text-soft [animation-delay:1.4s] lg:block" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Ready to Get Your Virtual Number?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-lg text-white/75 lg:mx-0">
                Discover a more straightforward way to receive SMS verification codes.
              </p>
              <a
                href="/register"
                className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-bold text-deep shadow-[0_16px_34px_-10px_rgb(0_0_0/0.45)] transition-all hover:-translate-y-0.5 hover:bg-soft"
              >
                Let&apos;s Get Started
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </a>
            </div>

            <div className="relative mx-auto w-48 sm:w-60 lg:w-72">
              <div aria-hidden className="absolute inset-4 rounded-full bg-white/20 blur-2xl" />
              <Image
                src={assets.megaphone.src}
                width={assets.megaphone.width}
                height={assets.megaphone.height}
                alt="Mascot announcing with a megaphone"
                sizes="288px"
                className="relative h-auto w-full drop-shadow-[0_20px_30px_rgb(3_14_80/0.5)] transition-transform duration-500 hover:-rotate-3 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
