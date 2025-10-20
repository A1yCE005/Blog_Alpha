import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

export type StormQuote = {
  text: string;
  source?: string;
  context?: string;
  link?: string;
};

const STORM_FILE_PATH = path.join(process.cwd(), "content", "posts", "storm", "storm.md");

function normalizeQuote(entry: unknown): StormQuote | null {
  if (typeof entry === "string") {
    const normalized = entry.trim();
    if (!normalized) {
      return null;
    }
    return { text: normalized } satisfies StormQuote;
  }

  if (entry && typeof entry === "object") {
    const { text, source, context, link } = entry as Record<string, unknown>;
    const normalizedText = typeof text === "string" ? text.trim() : "";
    if (!normalizedText) {
      return null;
    }
    const normalizedSource = typeof source === "string" ? source.trim() : undefined;
    const normalizedContext = typeof context === "string" ? context.trim() : undefined;
    const normalizedLink = typeof link === "string" ? link.trim() : undefined;

    return {
      text: normalizedText,
      source: normalizedSource,
      context: normalizedContext,
      link: normalizedLink,
    } satisfies StormQuote;
  }

  return null;
}

function parseFallbackContent(content: string): StormQuote[] {
  const sections = content
    .split(/\n-{3,}\n/g)
    .map((section) => section.trim())
    .filter(Boolean);

  if (sections.length === 0) {
    return [];
  }

  return sections
    .map((section) => {
      const [firstLine, ...rest] = section.split(/\n+/);
      const text = [firstLine, ...rest.filter(Boolean)].join(" ").trim();
      if (!text) {
        return null;
      }
      return { text } satisfies StormQuote;
    })
    .filter((quote): quote is StormQuote => quote !== null);
}

export async function getStormQuotes(): Promise<StormQuote[]> {
  let raw: string;
  try {
    raw = await fs.readFile(STORM_FILE_PATH, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const { data, content } = matter(raw);
  const rawQuotes = Array.isArray((data as Record<string, unknown>).quotes)
    ? ((data as Record<string, unknown>).quotes as unknown[])
    : [];

  const normalizedQuotes = rawQuotes
    .map((entry) => normalizeQuote(entry))
    .filter((quote): quote is StormQuote => quote !== null);

  if (normalizedQuotes.length > 0) {
    return normalizedQuotes;
  }

  return parseFallbackContent(content);
}
