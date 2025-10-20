import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

export type StormQuote = {
  text: string;
  attribution?: string;
};

export type StormContent = {
  title: string;
  description?: string;
  quotes: StormQuote[];
};

const STORM_FILE_PATH = path.join(process.cwd(), "content", "posts", "storm", "storm.md");

function normalizeQuoteEntry(entry: unknown): StormQuote | null {
  if (!entry) {
    return null;
  }

  if (typeof entry === "string") {
    const normalized = entry.trim();
    if (!normalized) {
      return null;
    }
    return { text: normalized };
  }

  if (typeof entry === "object") {
    const record = entry as Record<string, unknown>;
    const maybeText = record.text;
    const maybeAttribution = record.attribution;

    const text = typeof maybeText === "string" ? maybeText.trim() : "";
    const attribution = typeof maybeAttribution === "string" ? maybeAttribution.trim() : undefined;

    if (!text) {
      return null;
    }

    return attribution ? { text, attribution } : { text };
  }

  return null;
}

function normalizeQuotes(raw: unknown): StormQuote[] {
  if (!raw) {
    return [];
  }

  if (Array.isArray(raw)) {
    return raw
      .map((entry) => normalizeQuoteEntry(entry))
      .filter((quote): quote is StormQuote => Boolean(quote));
  }

  const normalized = normalizeQuoteEntry(raw);
  return normalized ? [normalized] : [];
}

export async function getStormContent(): Promise<StormContent | null> {
  let rawFile: string;
  try {
    rawFile = await fs.readFile(STORM_FILE_PATH, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }

  const { data, content } = matter(rawFile);
  const quotes = normalizeQuotes(data.quotes ?? data.entries ?? content?.split(/\n---\n/) ?? []);

  if (quotes.length === 0) {
    return null;
  }

  const title = typeof data.title === "string" && data.title.trim().length > 0 ? data.title.trim() : "Storm";
  const description =
    typeof data.description === "string" && data.description.trim().length > 0
      ? data.description.trim()
      : undefined;

  return {
    title,
    description,
    quotes,
  };
}
