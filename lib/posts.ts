import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import { compileMarkdownToHtml } from "@/lib/markdown";

export type PostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  tags: string[];
};

export type PostContent = PostSummary & {
  contentHtml: string;
};

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

function formatReadingTime(content: string) {
  const words = content
    .replace(/```[\s\S]*?```/g, "")
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function normalizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((tag) => (typeof tag === "string" ? tag : String(tag)))
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(/[,\n]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function truncateExcerpt(text: string, limit = 320) {
  if (text.length <= limit) return text;
  const truncated = text.slice(0, limit);
  const sanitized = truncated.replace(/[\s\p{P}]+$/u, "").trim();
  const base = sanitized.length > 0 ? sanitized : truncated.trim();
  return `${base}…`;
}

function stripMarkdownFormatting(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, ""))
    .replace(/`([^`]+)`/g, "$1")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/^#+\s+/gm, "")
    .replace(/^[\t >]*[-+*]\s+/gm, "")
    .replace(/\\([\\`*_{}\[\]()#+\-.!])/g, "$1");
}

async function parsePostFile(filePath: string, slug: string): Promise<PostContent> {
  const raw = await fs.readFile(filePath, "utf8");
  const { data, content } = matter(raw);

  const title = typeof data.title === "string" ? data.title : slug;
  const date = typeof data.date === "string" ? data.date : new Date().toISOString();
  const tags = normalizeTags(data.tags);

  const excerptSource =
    typeof data.excerpt === "string" && data.excerpt.trim().length > 0
      ? data.excerpt
      : content.split(/\n\s*\n/)[0] ?? "";

  const plainExcerpt = stripMarkdownFormatting(excerptSource);
  const cleanedExcerpt = plainExcerpt.replace(/\s+/g, " ").trim();
  const excerpt = truncateExcerpt(cleanedExcerpt);

  const readingTime =
    typeof data.readingTime === "string" && data.readingTime.trim().length > 0
      ? data.readingTime
      : formatReadingTime(content);

  const contentHtml = await compileMarkdownToHtml(content);

  return {
    slug,
    title,
    excerpt,
    date,
    readingTime,
    tags,
    contentHtml,
  } satisfies PostContent;
}

export async function getAllPosts(): Promise<PostSummary[]> {
  let files: string[] = [];
  try {
    files = await fs.readdir(POSTS_DIR);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
  const mdFiles = files.filter((file) => file.endsWith(".md"));

  const posts = await Promise.all(
    mdFiles.map(async (file) => {
      const slug = file.replace(/\.md$/, "");
      const filePath = path.join(POSTS_DIR, file);
      return parsePostFile(filePath, slug);
    })
  );

  return posts
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(({ contentHtml: _contentHtml, ...summary }) => summary);
}

export async function getPostBySlug(slug: string): Promise<PostContent | null> {
  const slugSegments = slug.split(/[\\/]/).filter(Boolean);
  if (slugSegments.length === 0) {
    return null;
  }

  const filePathBase = path.join(POSTS_DIR, ...slugSegments);
  const filePath = filePathBase.endsWith(".md") ? filePathBase : `${filePathBase}.md`;
  const normalizedSlug = slugSegments[slugSegments.length - 1]!.replace(/\.md$/, "");
  try {
    return await parsePostFile(filePath, normalizedSlug);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}
