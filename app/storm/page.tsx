import type { Metadata } from "next";

import { StormPageContent } from "./StormPageContent";
import { siteConfig } from "@/config/site";
import { loadStormQuotes } from "@/lib/storm";

export const metadata: Metadata = {
  title: "Storm",
  description:
    "An endless field guide of quotes and prompts to navigate the creative storm. Scroll infinitely to gather new signals.",
  keywords: [siteConfig.name, "creative prompts", "quotes"],
};

export default async function StormPage() {
  const quotes = await loadStormQuotes();
  return <StormPageContent quotes={quotes} />;
}
