import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

export type StormQuote = {
  text: string;
  source?: string;
};

export type StormContent = {
  title: string;
  description: string;
  quotes: StormQuote[];
};

const STORM_FILE_PATH = path.join(
  process.cwd(),
  "content",
  "posts",
  "storm",
  "storm.md"
);

function normalizeQuotes(rawQuotes: unknown): StormQuote[] {
  if (!Array.isArray(rawQuotes)) {
    return [];
  }

  const quotes: StormQuote[] = [];

  for (const entry of rawQuotes) {
    if (typeof entry === "string") {
      const text = entry.trim();
      if (text.length > 0) {
        quotes.push({ text });
      }
      continue;
    }

    if (entry && typeof entry === "object") {
      const maybeText = Reflect.get(entry, "text");
      const maybeSource = Reflect.get(entry, "source");
      if (typeof maybeText === "string" && maybeText.trim().length > 0) {
        const text = maybeText.trim();
        const source = typeof maybeSource === "string" && maybeSource.trim().length > 0
          ? maybeSource.trim()
          : undefined;
        quotes.push({ text, source });
      }
    }
  }

  return quotes;
}

export async function getStormContent(): Promise<StormContent> {
  const raw = await fs.readFile(STORM_FILE_PATH, "utf8");
  const { data, content } = matter(raw);

  const title = typeof data.title === "string" && data.title.trim().length > 0
    ? data.title.trim()
    : "Storm";

  const description = typeof data.description === "string" && data.description.trim().length > 0
    ? data.description.trim()
    : content.split(/\n+/).map((line) => line.trim()).find((line) => line.length > 0) ?? "";

  const quotes = normalizeQuotes(data.quotes);

  if (quotes.length > 0) {
    return { title, description, quotes };
  }

  const fallbackQuotes = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block) => {
      const [firstLine, ...rest] = block.split(/\n/);
      const text = (firstLine ?? "").trim();
      const source = rest.join(" ").trim();
      if (text.length === 0) {
        return null;
      }
      return {
        text,
        source: source.length > 0 ? source : undefined,
      } satisfies StormQuote;
    })
    .filter((quote): quote is StormQuote => quote !== null);

  return { title, description, quotes: fallbackQuotes };
}
