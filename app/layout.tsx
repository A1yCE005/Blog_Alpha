import "./globals.css";
import "katex/dist/katex.min.css";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import {
  PAGE_TRANSITION_DURATION,
  PAGE_TRANSITION_EASING,
} from "@/lib/transitions";

const rootStyle = {
  "--page-transition-duration": PAGE_TRANSITION_DURATION,
  "--page-transition-easing": PAGE_TRANSITION_EASING,
} as CSSProperties;

export const metadata: Metadata = {
  title: "Lighthosue",
  description: "Midjourney-style letter cloud hero animation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={rootStyle}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
