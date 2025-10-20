import type { Metadata } from "next";

import { loadStormQuotes } from "@/lib/storm";
import { StormPageContent } from "./StormPageContent";

export const metadata: Metadata = {
  title: "Storm · Lighthouse",
  description:
    "An endless field guide of quotes and prompts to navigate the creative storm. Scroll infinitely to gather new signals.",
};

export default async function StormPage() {
  const quotes = await loadStormQuotes();
  return <StormPageContent quotes={quotes} />;
}
