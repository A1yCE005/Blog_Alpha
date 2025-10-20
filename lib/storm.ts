import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

export type StormQuote = {
  text: string;
  attribution?: string;
  source?: string;
  note?: string;
};

const STORM_FILE_PATH = path.join(process.cwd(), "content", "posts", "storm", "storm.md");

function normalizeQuote(raw: unknown): StormQuote | null {
  if (typeof raw === "string") {
    const text = raw.trim();
    return text ? { text } : null;
  }

  if (!raw || typeof raw !== "object") {
    return null;
  }

  const maybeText = (raw as Record<string, unknown>).text;
  const text = typeof maybeText === "string" ? maybeText.trim() : "";
  if (!text) {
    return null;
  }

  const attributionRaw = (raw as Record<string, unknown>).attribution;
  const sourceRaw = (raw as Record<string, unknown>).source;
  const noteRaw = (raw as Record<string, unknown>).note;

  const attribution = typeof attributionRaw === "string" ? attributionRaw.trim() : undefined;
  const source = typeof sourceRaw === "string" ? sourceRaw.trim() : undefined;
  const note = typeof noteRaw === "string" ? noteRaw.trim() : undefined;

  return { text, attribution, source, note };
}

export async function getStormQuotes(): Promise<StormQuote[]> {
  let raw = "";
  try {
    raw = await fs.readFile(STORM_FILE_PATH, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const { data } = matter(raw);
  const quotesData = Array.isArray((data as Record<string, unknown>).quotes)
    ? ((data as Record<string, unknown>).quotes as unknown[])
    : [];

  const quotes: StormQuote[] = [];
  for (const entry of quotesData) {
    const normalized = normalizeQuote(entry);
    if (normalized) {
      quotes.push(normalized);
    }
  }

  return quotes;
}
