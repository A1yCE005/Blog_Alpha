import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

export type StormQuote = {
  text: string;
  source?: string;
};

const STORM_POST_PATH = path.join(process.cwd(), "content", "posts", "storm", "storm.md");

function normalizeQuote(raw: unknown): StormQuote | null {
  if (!raw) {
    return null;
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }
    return { text: trimmed };
  }

  if (typeof raw === "object") {
    const candidate = raw as Record<string, unknown>;
    const textValue = candidate.text ?? candidate.quote ?? candidate.content;
    const sourceValue = candidate.source ?? candidate.attribution ?? candidate.author;
    const text = typeof textValue === "string" ? textValue.trim() : "";
    const source = typeof sourceValue === "string" ? sourceValue.trim() : undefined;

    if (!text) {
      return null;
    }

    return source ? { text, source } : { text };
  }

  return null;
}

function parseQuotesFromBody(body: string): StormQuote[] {
  return body
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split(/\n+/).map((line) => line.trim()).filter(Boolean);
      if (lines.length === 0) {
        return null;
      }

      let source: string | undefined;
      const lastLine = lines[lines.length - 1];
      const sourceMatch = lastLine.match(/^[\-–—]\s*(.+)$/);
      if (sourceMatch) {
        source = sourceMatch[1]?.trim();
        lines.pop();
      }

      const text = lines.join(" ");
      if (!text) {
        return null;
      }

      return source ? { text, source } : { text };
    })
    .filter((quote): quote is StormQuote => quote !== null);
}

function deduplicateQuotes(quotes: StormQuote[]): StormQuote[] {
  const seen = new Set<string>();
  const result: StormQuote[] = [];

  for (const quote of quotes) {
    const key = `${quote.text}:::${quote.source ?? ""}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(quote);
  }

  return result;
}

export async function getStormQuotes(): Promise<StormQuote[]> {
  let raw: string;
  try {
    raw = await fs.readFile(STORM_POST_PATH, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const { data, content } = matter(raw);

  let quotes: StormQuote[] = [];
  const frontmatterQuotes = Array.isArray(data.quotes) ? data.quotes : [];

  quotes = frontmatterQuotes
    .map((entry) => normalizeQuote(entry))
    .filter((quote): quote is StormQuote => quote !== null);

  if (quotes.length === 0 && typeof data.quote === "string") {
    const singleQuote = normalizeQuote(data.quote);
    if (singleQuote) {
      quotes.push(singleQuote);
    }
  }

  if (quotes.length === 0) {
    quotes = parseQuotesFromBody(content);
  }

  return deduplicateQuotes(quotes);
}
