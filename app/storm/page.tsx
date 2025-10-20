import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { StormPageContent } from "./StormPageContent";

const STORM_FILE_PATH = path.join(process.cwd(), "content", "posts", "storm", "storm.md");

type StormFrontmatter = {
  title?: unknown;
  description?: unknown;
  quotes?: unknown;
};

type StormContent = {
  title: string;
  description?: string;
  quotes: string[];
};

const loadStormContent = cache(async (): Promise<StormContent> => {
  let raw: string;
  try {
    raw = await fs.readFile(STORM_FILE_PATH, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      notFound();
    }
    throw error;
  }

  const { data } = matter(raw);
  const frontmatter = data as StormFrontmatter;

  const quotesRaw = Array.isArray(frontmatter.quotes) ? frontmatter.quotes : [];
  const quotes = quotesRaw
    .map((entry) => {
      if (typeof entry === "string") {
        return entry.trim();
      }
      if (entry && typeof entry === "object" && "text" in entry && typeof entry.text === "string") {
        return entry.text.trim();
      }
      return "";
    })
    .map((quote) => quote.replace(/\s+/g, " ").trim())
    .filter((quote) => quote.length > 0);

  if (quotes.length === 0) {
    notFound();
  }

  const rawTitle = frontmatter.title;
  const title = typeof rawTitle === "string" && rawTitle.trim().length > 0 ? rawTitle.trim() : "Storm";

  const rawDescription = frontmatter.description;
  const description =
    typeof rawDescription === "string" && rawDescription.trim().length > 0
      ? rawDescription.trim()
      : quotes[0]?.slice(0, 160);

  return {
    title,
    description,
    quotes,
  };
});

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadStormContent();
  return {
    title: `${content.title} · Lighthouse`,
    description: content.description ?? content.quotes[0],
  };
}

export default async function StormPage() {
  const content = await loadStormContent();
  return <StormPageContent quotes={content.quotes} />;
}

