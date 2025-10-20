import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StormPageContent } from "./StormPageContent";

type StormQuote = {
  text: string;
  attribution?: string;
  context?: string;
};

type RawQuotes = {
  quotes?: unknown;
};

const STORM_FILE_PATH = path.join(process.cwd(), "content", "posts", "storm", "storm.md");

export const metadata: Metadata = {
  title: "Storm · Lighthouse",
  description:
    "An endless cascade of storm notes, fragments, and rallying words pulled from the Lighthouse journal archive.",
};

function normalizeQuote(raw: unknown): StormQuote | null {
  if (typeof raw === "string") {
    const text = raw.trim();
    return text.length > 0 ? { text } : null;
  }

  if (!raw || typeof raw !== "object") {
    return null;
  }

  const candidate = raw as Record<string, unknown>;
  const textCandidate = candidate.text ?? candidate.quote ?? candidate.body;
  if (typeof textCandidate !== "string") {
    return null;
  }
  const text = textCandidate.trim();
  if (!text) {
    return null;
  }

  const attributionCandidate = candidate.attribution ?? candidate.author ?? candidate.source;
  const contextCandidate = candidate.context ?? candidate.detail ?? candidate.note;

  return {
    text,
    attribution: typeof attributionCandidate === "string" ? attributionCandidate.trim() : undefined,
    context: typeof contextCandidate === "string" ? contextCandidate.trim() : undefined,
  } satisfies StormQuote;
}

function parseQuotes(data: RawQuotes, content: string): StormQuote[] {
  const fromFrontMatter = Array.isArray(data.quotes)
    ? data.quotes.map(normalizeQuote).filter((quote): quote is StormQuote => quote !== null)
    : [];

  if (fromFrontMatter.length > 0) {
    return fromFrontMatter;
  }

  const blocks = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      const [firstLine, ...rest] = block.split(/\n/).map((line) => line.replace(/^>\s*/, "").trim());
      if (!firstLine) {
        return null;
      }
      const attribution = rest
        .map((line) => line.replace(/^[-–—]+\s*/, "").trim())
        .filter(Boolean)
        .join(" ");
      return {
        text: firstLine,
        attribution: attribution.length > 0 ? attribution : undefined,
      } satisfies StormQuote;
    })
    .filter((quote): quote is StormQuote => quote !== null);
}

async function loadStormQuotes(): Promise<StormQuote[]> {
  let raw: string;
  try {
    raw = await fs.readFile(STORM_FILE_PATH, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const parsed = matter(raw) as matter.GrayMatterFile<string> & { data: RawQuotes };
  return parseQuotes(parsed.data, parsed.content);
}

export default async function StormPage() {
  const quotes = await loadStormQuotes();

  if (quotes.length === 0) {
    notFound();
  }

  return <StormPageContent quotes={quotes} />;
}
