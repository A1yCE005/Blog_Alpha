import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArchivePageContent } from "./ArchivePageContent";
import { siteConfig } from "@/config/site";
import { getAllPosts } from "@/lib/posts";
import type { PostSummary } from "@/lib/posts";

const POSTS_PER_PAGE = 10;

type TagSummary = {
  name: string;
  count: number;
};

function getTopTags(posts: PostSummary[], limit = 5): TagSummary[] {
  const tagCounts = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.tags) {
      const normalized = tag.trim();
      if (!normalized) continue;
      tagCounts.set(normalized, (tagCounts.get(normalized) ?? 0) + 1);
    }
  }

  return Array.from(tagCounts.entries())
    .sort((a, b) => {
      const countDifference = b[1] - a[1];
      if (countDifference !== 0) {
        return countDifference;
      }
      return a[0].localeCompare(b[0]);
    })
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

export const metadata: Metadata = {
  title: "Archive",
  description: `Browse every post in the ${siteConfig.name} archive. Discover essays, signals, and experiments from the studio's history.`,
};

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function resolvePage(searchParams: PageProps["searchParams"]): number {
  const raw = searchParams?.page;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) {
    return 1;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    notFound();
  }
  return parsed;
}

function getPageHref(page: number) {
  return page === 1 ? "/archive" : `/archive?page=${page}`;
}

export default async function ArchivePage({ searchParams }: PageProps) {
  const page = resolvePage(searchParams);
  if (page < 1) {
    notFound();
  }

  const posts = await getAllPosts();
  const topTags = getTopTags(posts);
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const lastPage = Math.max(totalPages, 1);

  if (page > lastPage) {
    notFound();
  }

  const start = (page - 1) * POSTS_PER_PAGE;
  const visiblePosts = posts.slice(start, start + POSTS_PER_PAGE);
  const hasPrevious = page > 1;
  const hasNext = page < lastPage && posts.length > 0;
  const previousPage = page - 1;
  const nextPage = page + 1;

  const previousHref = hasPrevious ? getPageHref(previousPage) : getPageHref(page);
  const nextHref = hasNext ? getPageHref(nextPage) : getPageHref(page);

  return (
    <ArchivePageContent
      posts={visiblePosts}
      allPosts={posts}
      page={page}
      lastPage={lastPage}
      hasPrevious={hasPrevious}
      hasNext={hasNext}
      previousHref={previousHref}
      nextHref={nextHref}
      topTags={topTags}
    />
  );
}
