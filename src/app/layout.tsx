import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { MotionProvider } from "@/components/MotionProvider";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: `${site.name} — Virtual Numbers Made Simple`,
  description: site.description,
  openGraph: {
    title: `${site.name} — Virtual Numbers Made Simple`,
    description: site.description,
    images: [{ url: "/assets/mascot-3d.webp" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#2875fb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="antialiased">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
