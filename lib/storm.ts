import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

export type StormQuote = {
  text: string;
  author?: string;
  source?: string;
};

const STORM_POST_PATH = path.join(process.cwd(), "content", "posts", "storm", "storm.md");

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeQuote(raw: unknown): StormQuote | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const text = normalizeText(record.text);
  const author = normalizeText(record.author);
  const source = normalizeText(record.source);

  if (!text) {
    return null;
  }

  return {
    text,
    author: author || undefined,
    source: source || undefined,
  } satisfies StormQuote;
}

export async function loadStormQuotes(): Promise<StormQuote[]> {
  let raw: string;

  try {
    raw = await fs.readFile(STORM_POST_PATH, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const { data } = matter(raw);
  const quotesData = Array.isArray(data.quotes) ? data.quotes : [];

  const quotes = quotesData
    .map((entry) => normalizeQuote(entry))
    .filter((quote): quote is StormQuote => Boolean(quote));

  return quotes;
}
