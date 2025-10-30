import "./globals.css";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { siteConfig } from "@/config/site";

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const mono = Fira_Code({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
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
      <body className={`${sans.variable} ${mono.variable} bg-background text-foreground font-sans antialiased`}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
