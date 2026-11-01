export const site = {
  name: "Bluffy",
  description:
    "Virtual numbers made simple. Get access to SMS verification through one straightforward platform.",
  tagline: "Your number. Your digital access.",
  year: 2026,
};

export const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Showcase", href: "#showcase" },
  { label: "Contact", href: "#contact" },
] as const;

export const assets = {
  hero: { src: "/assets/mascot-3d.webp", width: 1044, height: 1101 },
  happy: { src: "/assets/pose-happy.webp", width: 552, height: 568 },
  megaphone: { src: "/assets/pose-megaphone.webp", width: 712, height: 536 },
  wave: { src: "/assets/pose-wave.webp", width: 576, height: 532 },
  line: { src: "/assets/pose-line.webp", width: 948, height: 672 },
} as const;
