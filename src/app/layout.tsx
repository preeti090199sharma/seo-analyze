import type { Metadata, Viewport } from "next";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEO Analyzer Pro — Free Website SEO Toolkit",
  description:
    "Free SEO toolkit: site analyzer, meta tags generator, schema markup, keyword density checker, readability analyzer, and more. Download PDF reports.",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
