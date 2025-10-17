import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAllPosts } from "@/lib/posts";
import { ArchivePageContent } from "./ArchivePageContent";

const POSTS_PER_PAGE = 10;

export const metadata: Metadata = {
  title: "Archive · Lighthouse",
  description:
    "Browse every post in the Letter Cloud blog archive. Discover essays, signals, and experiments from the studio's history.",
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
      page={page}
      lastPage={lastPage}
      hasPrevious={hasPrevious}
      hasNext={hasNext}
      previousHref={previousHref}
      nextHref={nextHref}
    />
  );
}
