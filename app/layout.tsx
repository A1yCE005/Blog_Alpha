import "./globals.css";
import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Lighthosue",
  description: "Midjourney-style letter cloud hero animation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
