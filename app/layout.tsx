import "./globals.css";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { ViewportUnitSetter } from "@/components/ViewportUnitSetter";

export const metadata: Metadata = {
  title: "Lighthosue",
  description: "Lighthouse in the Storm",
  icons: {
    icon: "/image/icon.svg",
    shortcut: "/image/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>
        <ViewportUnitSetter />
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
