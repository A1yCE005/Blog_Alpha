import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getStormContent } from "@/lib/storm";
import { StormPageContent } from "./StormPageContent";

const PAGE_TITLE = "Storm · Lighthouse";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: "Endless fragments from the storm-bound journal.",
};

export default async function StormPage() {
  const stormContent = await getStormContent();

  if (!stormContent) {
    notFound();
  }

  return <StormPageContent {...stormContent} />;
}
