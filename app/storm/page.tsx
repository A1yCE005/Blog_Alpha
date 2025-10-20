import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getStormContent } from "@/lib/storm";
import { StormPageContent } from "./StormPageContent";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { title, description } = await getStormContent();
    return {
      title: `${title} · Lighthouse`,
      description: description || undefined,
    };
  } catch (error) {
    return {
      title: "Storm · Lighthouse",
      description: "A looping gallery of storm-borne lines from the studio archive.",
    };
  }
}

export default async function StormPage() {
  try {
    const content = await getStormContent();
    if (content.quotes.length === 0) {
      return <StormPageContent title={content.title} description={content.description} quotes={[]} />;
    }
    return <StormPageContent title={content.title} description={content.description} quotes={content.quotes} />;
  } catch (error) {
    notFound();
  }

  return null;
}
