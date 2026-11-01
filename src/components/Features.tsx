import Image from "next/image";
import { Globe, MessageSquare, ShieldCheck, Zap } from "lucide-react";
import { assets } from "@/lib/site";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-24 sm:px-6 lg:py-32">
      <SectionHeading
        eyebrow="Features"
        title="More Than Just a Number."
        text="A platform built for simple, transparent virtual number access."
      />

      <div className="mt-14 grid gap-5 md:grid-cols-6 md:grid-rows-[auto_auto]">
        {/* 1 — large */}
        <Reveal className="md:col-span-4">
          <article className="group relative flex h-full min-h-[300px] flex-col justify-between overflow-hidden rounded-[2rem] bg-white p-7 shadow-soft ring-1 ring-soft/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift sm:p-9">
            <div className="relative z-10 max-w-[16rem]">
              <Globe className="text-primary" size={30} />
              <h3 className="mt-5 text-2xl font-bold">Multiple Countries</h3>
              <p className="mt-2 leading-relaxed text-navy/65">
                Explore supported virtual numbers from different countries.
              </p>
            </div>
            <Image
              src={assets.happy.src}
              width={assets.happy.width}
              height={assets.happy.height}
              alt=""
              sizes="(min-width:768px) 280px, 60vw"
              className="pointer-events-none absolute -bottom-3 -right-4 w-44 transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-105 sm:w-60"
            />
            <div
              aria-hidden
              className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-soft/50 blur-2xl"
            />
          </article>
        </Reveal>

        {/* 2 — navy */}
        <Reveal className="md:col-span-2" delay={0.1}>
          <article className="group relative flex h-full min-h-[300px] flex-col overflow-hidden rounded-[2rem] bg-gradient-to-br from-deep to-navy p-7 text-white shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift">
            <MessageSquare className="text-soft" size={30} />
            <h3 className="mt-5 text-2xl font-bold">SMS in One Place</h3>
            <p className="mt-2 leading-relaxed text-white/70">
              View incoming messages through a clear, organized inbox.
            </p>
            <Image
              src={assets.wave.src}
              width={assets.wave.width}
              height={assets.wave.height}
              alt=""
              sizes="200px"
              className="pointer-events-none mt-auto ml-auto w-36 translate-y-4 transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-3"
            />
          </article>
        </Reveal>

        {/* 3 — soft */}
        <Reveal className="md:col-span-2" delay={0.05}>
          <article className="group relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-[2rem] bg-soft/60 p-7 ring-1 ring-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift">
            <Zap className="text-deep" size={30} />
            <h3 className="mt-5 text-2xl font-bold">Simple Activation</h3>
            <p className="mt-2 leading-relaxed text-navy/65">
              A straightforward process for selecting and activating numbers.
            </p>
            <div className="mt-auto flex gap-2 pt-6" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 flex-1 rounded-full bg-primary/30 transition-all duration-500 group-hover:bg-primary"
                  style={{ transitionDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          </article>
        </Reveal>

        {/* 4 — wide */}
        <Reveal className="md:col-span-4" delay={0.15}>
          <article className="group relative flex h-full min-h-[280px] items-center overflow-hidden rounded-[2rem] bg-white p-7 shadow-soft ring-1 ring-soft/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift sm:p-9">
            <div className="relative z-10 max-w-[15rem]">
              <ShieldCheck className="text-primary" size={30} />
              <h3 className="mt-5 text-2xl font-bold">Transparent Pricing</h3>
              <p className="mt-2 leading-relaxed text-navy/65">
                See pricing clearly before placing an order.
              </p>
            </div>
            <Image
              src={assets.megaphone.src}
              width={assets.megaphone.width}
              height={assets.megaphone.height}
              alt=""
              sizes="(min-width:768px) 300px, 55vw"
              className="pointer-events-none absolute -right-4 bottom-0 w-44 transition-transform duration-500 group-hover:scale-105 sm:right-2 sm:w-64"
            />
          </article>
        </Reveal>
      </div>
    </section>
  );
}
