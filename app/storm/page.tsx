import type { Metadata } from "next";

import { getStormQuotes } from "@/lib/storm";
import { StormPageContent } from "./StormPageContent";

const PAGE_TITLE = "Storm · Lighthouse";
const PAGE_DESCRIPTION =
  "An endless stream of studio notes, mottos, and fragments resurfacing from the Storm library.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
};

export default async function StormPage() {
  const quotes = await getStormQuotes();
  return <StormPageContent quotes={quotes} />;
}
