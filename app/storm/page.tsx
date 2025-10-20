import type { Metadata } from "next";

import { StormPageContent } from "@/components/StormPageContent";
import { getStormQuotes } from "@/lib/storm";

const PAGE_TITLE = "Storm · Lighthouse";
const PAGE_DESCRIPTION = "An endless cascade of studio aphorisms, remixed with every scroll.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
};

export default async function StormPage() {
  const quotes = await getStormQuotes();
  return <StormPageContent quotes={quotes} />;
}
