import "./globals.css";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { JetBrains_Mono as JetBrainsMono, Manrope } from "next/font/google";

import { siteConfig } from "@/lib/site-config";

const bodyFont = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const monoFont = JetBrainsMono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  themeColor: siteConfig.themeColor,
  icons: {
    icon: "/image/icon.svg",
    shortcut: "/image/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${monoFont.variable}`}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
