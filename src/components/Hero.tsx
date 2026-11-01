"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, Mail, Sparkles } from "lucide-react";
import { assets } from "@/lib/site";
import { Bubble, Ring, Star } from "./Decor";

export function Hero() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // cursor follow (desktop, fine pointer only)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 18, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 90, damping: 18, mass: 0.6 });
  const rotY = useTransform(sx, [-1, 1], [-7, 7]);
  const rotX = useTransform(sy, [-1, 1], [5, -5]);
  const tx = useTransform(sx, [-1, 1], [-14, 14]);
  const ty = useTransform(sy, [-1, 1], [-10, 10]);

  // scroll parallax
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 40]);

  useEffect(() => {
    if (reduce) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!fine.matches) return;
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1);
      my.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my, reduce]);

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-gradient-to-b from-soft/70 via-[#E3ECFE] to-canvas pb-28 pt-28 sm:pt-32 lg:pb-36 lg:pt-36"
    >
      {/* abstract backdrop */}
      <motion.div aria-hidden style={{ y: bgY }} className="absolute inset-0 -z-10">
        <div className="absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-24 top-40 h-[480px] w-[480px] rounded-full bg-white/80 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(rgb(40 117 251 / .35) 1.2px, transparent 1.2px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse at 70% 40%, #000, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse at 70% 40%, #000, transparent 70%)",
          }}
        />
      </motion.div>

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-6">
        {/* copy */}
        <div className="relative z-10 text-center lg:text-left">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-deep ring-1 ring-white backdrop-blur"
          >
            ✨ The Friendlier Way to Verify
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-[2.6rem] font-extrabold leading-[1.04] tracking-tight text-navy min-[400px]:text-5xl sm:text-6xl xl:text-7xl"
          >
            Virtual Numbers,{" "}
            <span className="relative whitespace-nowrap bg-gradient-to-r from-primary to-deep bg-clip-text text-transparent">
              Made Simple
            </span>
            .
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-navy/70 lg:mx-0"
          >
            Get virtual numbers for SMS verification without the unnecessary
            complexity. Choose your service, receive your code, and keep
            everything in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start"
          >
            <a
              href="/register"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-4 font-semibold text-white shadow-[0_14px_30px_-8px_rgb(40_117_251/0.7)] transition-all hover:-translate-y-0.5 hover:bg-deep"
            >
              Get Started
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white/70 px-7 py-4 font-semibold text-navy ring-1 ring-soft backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white hover:ring-primary/40"
            >
              See How It Works
            </a>
          </motion.div>
        </div>

        {/* mascot stage */}
        <motion.div
          style={{ y: reduce ? 0 : parallaxY }}
          className="relative mx-auto w-full max-w-[340px] min-[400px]:max-w-[400px] sm:max-w-[500px] lg:max-w-[560px]"
        >
          <Star className="absolute -left-2 top-6 z-20 h-8 w-8 text-primary sm:-left-8 sm:h-10 sm:w-10" />
          <Star className="absolute -right-1 top-1/3 z-20 h-5 w-5 text-deep [animation-delay:1.2s] sm:-right-6 sm:h-7 sm:w-7" />
          <Star className="absolute bottom-16 -left-3 z-20 h-6 w-6 text-white [animation-delay:2s] sm:-left-10" />
          <Bubble className="-right-3 top-0 z-20 h-10 w-10 sm:-right-8 sm:h-14 sm:w-14" />
          <Bubble className="-bottom-2 right-8 z-20 h-6 w-6 [animation-delay:1.5s] sm:h-9 sm:w-9" />
          <Ring className="-left-6 bottom-24 z-0 h-16 w-16 [animation-delay:2.5s] sm:-left-14 sm:h-24 sm:w-24" />

          <motion.div
            style={{ x: reduce ? 0 : tx, y: reduce ? 0 : ty, rotateY: reduce ? 0 : rotY, rotateX: reduce ? 0 : rotX }}
            className="[perspective:1000px]"
          >
            <motion.div
              animate={reduce ? undefined : { y: [0, -16, 0], rotate: [-1.2, 1.2, -1.2] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              {/* glow */}
              <div
                aria-hidden
                className="absolute inset-6 -z-10 rounded-[3rem] bg-primary/40 blur-3xl"
              />
              <div className="overflow-hidden rounded-[2.6rem] bg-white/40 p-2 shadow-lift ring-1 ring-white/80 backdrop-blur sm:rounded-[3.2rem] sm:p-3">
                <Image
                  src={assets.hero.src}
                  width={assets.hero.width}
                  height={assets.hero.height}
                  alt="Bluffy, the round blue furry mascot with big expressive eyes and small ears"
                  priority
                  sizes="(min-width:1024px) 540px, (min-width:640px) 480px, 90vw"
                  className="h-auto w-full rounded-[2.1rem] sm:rounded-[2.6rem]"
                />
              </div>

              {/* glass chips */}
              <motion.div
                animate={reduce ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                className="absolute -left-3 bottom-10 flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 text-sm font-bold text-navy shadow-soft ring-1 ring-white backdrop-blur-md sm:-left-10 sm:px-4 sm:py-3"
              >
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-white">
                  <Mail size={16} />
                </span>
                Code Delivered!
              </motion.div>
              <motion.div
                animate={reduce ? undefined : { y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-2 top-14 hidden items-center gap-2 rounded-2xl bg-navy/90 px-4 py-3 text-sm font-semibold text-white shadow-lift backdrop-blur-md min-[400px]:flex sm:-right-8"
              >
                <Sparkles size={16} className="text-soft" />
                Instant & Secure
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
