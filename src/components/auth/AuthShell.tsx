import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Bubble, Ring, Star } from "@/components/Decor";
import { assets } from "@/lib/site";

type Props = {
  children: React.ReactNode;
  mascot: keyof typeof assets;
  asideTitle: string;
  asideText: string;
};

export function AuthShell({ children, mascot, asideTitle, asideText }: Props) {
  const image = assets[mascot];
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-gradient-to-b from-soft/70 via-[#E3ECFE] to-canvas">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-24 top-40 h-[480px] w-[480px] rounded-full bg-white/80 blur-3xl" />
      </div>

      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-2">
        <div className="flex items-center justify-center px-5 py-10 sm:px-6 sm:py-14">
          <div className="w-full max-w-md">
            <Link href="/" aria-label="Bluffy home" className="mb-7 inline-flex sm:mb-9">
              <Logo />
            </Link>
            {children}
          </div>
        </div>

        <div className="relative hidden items-center justify-center overflow-hidden lg:flex">
          <div className="relative mx-auto w-full max-w-sm px-10">
            <Star className="absolute -left-4 top-4 h-8 w-8 text-primary" />
            <Star className="absolute right-0 top-1/3 h-5 w-5 text-deep [animation-delay:1.2s]" />
            <Bubble className="-right-2 bottom-10 h-10 w-10" />
            <Ring className="-left-10 bottom-24 h-20 w-20 [animation-delay:2s]" />

            <div className="rounded-[2.6rem] bg-white/40 p-3 shadow-lift ring-1 ring-white/80 backdrop-blur">
              <Image
                src={image.src}
                width={image.width}
                height={image.height}
                alt="Bluffy, the round blue furry mascot"
                priority
                sizes="400px"
                className="h-auto w-full rounded-[2.1rem]"
              />
            </div>

            <div className="mt-8 text-center">
              <h2 className="text-2xl font-extrabold tracking-tight text-navy">{asideTitle}</h2>
              <p className="mt-3 text-navy/65">{asideText}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
