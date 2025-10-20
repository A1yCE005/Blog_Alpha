import type { Metadata } from "next";

import { StormPageContent } from "@/components/StormPageContent";
import { getStormQuotes } from "@/lib/storm";

export const metadata: Metadata = {
  title: "Storm · Lighthouse",
  description:
    "A looping deck of quotes gathered from the Lighthouse studio archives. Scroll through the storm to find the line you need.",
};

export default async function StormPage() {
  const quotes = await getStormQuotes();
  return <StormPageContent quotes={quotes} />;
}
