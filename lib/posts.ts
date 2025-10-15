import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

export type PostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  tags: string[];
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
      const raw = await fs.readFile(filePath, "utf8");
      const { data, content } = matter(raw);

      const title = typeof data.title === "string" ? data.title : slug;
      const date = typeof data.date === "string" ? data.date : new Date().toISOString();
      const tags = normalizeTags(data.tags);

      const excerptSource =
        typeof data.excerpt === "string" && data.excerpt.trim().length > 0
          ? data.excerpt
          : content.split(/\n\s*\n/)[0] ?? "";

      const excerpt = excerptSource.replace(/\s+/g, " ").trim();

      const readingTime =
        typeof data.readingTime === "string" && data.readingTime.trim().length > 0
          ? data.readingTime
          : formatReadingTime(content);

      return {
        slug,
        title,
        excerpt,
        date,
        readingTime,
        tags,
      } satisfies PostSummary;
    })
  );

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
