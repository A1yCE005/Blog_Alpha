import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Letter Cloud Blog",
  description: "Midjourney-style letter cloud hero animation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
