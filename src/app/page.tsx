import { About } from "@/components/About";
import { CTA } from "@/components/CTA";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Highlights } from "@/components/Highlights";
import { Navbar } from "@/components/Navbar";
import { Showcase } from "@/components/Showcase";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Highlights />
        <Features />
        <Showcase />
        <About />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
