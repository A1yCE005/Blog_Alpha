import "./globals.css";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode, CSSProperties } from "react";

import { siteConfig } from "@/lib/site-config";

const fontSans = Inter({ subsets: ["latin"], display: "swap", variable: "--font-sans" });
const fontMono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  icons: {
    icon: "/image/icon.svg",
    shortcut: "/image/icon.svg",
  },
  applicationName: siteConfig.name,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const typographyStyles = {
    "--typography-body": siteConfig.typography.bodyFont,
    "--typography-mono": siteConfig.typography.monoFont,
  } as CSSProperties;

  return (
    <html lang="en" className="h-full">
      <body
        className={`${fontSans.variable} ${fontMono.variable} min-h-full bg-background text-foreground antialiased font-sans`}
        style={typographyStyles}
      >
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
