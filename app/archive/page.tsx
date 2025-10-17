import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { PostCard } from "@/components/PostCard";
import { getAllPosts } from "@/lib/posts";

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

function PaginationButton({
  disabled,
  href,
  children,
  rel,
  "aria-label": ariaLabel,
}: {
  disabled: boolean;
  href: string;
  children: ReactNode;
  rel?: "prev" | "next";
  "aria-label"?: string;
}) {
  const baseClassName =
    "inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black hover:border-violet-400/60 hover:text-violet-200";
  if (disabled) {
    return (
      <span
        role="link"
        aria-disabled="true"
        tabIndex={-1}
        className={`${baseClassName} cursor-not-allowed border-white/5 text-zinc-500 hover:border-white/5 hover:text-zinc-500`}
      >
        {children}
      </span>
    );
  }
  return (
    <Link href={href} rel={rel} aria-label={ariaLabel} className={baseClassName}>
      {children}
    </Link>
  );
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

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-10 px-6 py-16 sm:px-10">
      <header className="flex flex-col gap-3 text-left">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300/80">The Journal</p>
        <h1 className="text-3xl font-semibold text-zinc-50 sm:text-4xl">Archive</h1>
        <p className="max-w-2xl text-sm text-zinc-400 sm:text-base">
          Browse every post we&apos;ve published. Follow the full timeline of essays, signals, and experiments from the Letter Cloud studio.
        </p>
      </header>

      {visiblePosts.length > 0 ? (
        <div className="flex flex-col gap-6">
          {visiblePosts.map((post) => (
            <PostCard key={post.slug} post={post} href={`/posts/${post.slug}`} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/10 bg-zinc-950/50 p-12 text-center text-sm text-zinc-400">
          <p>
            No posts found yet. Drop a markdown file into <code>content/posts</code> to get started.
          </p>
        </div>
      )}

      <nav aria-label="Archive pagination" className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-6">
        <span className="text-sm text-zinc-400">
          Page {page} of {lastPage}
        </span>
        <div className="flex items-center gap-3">
          <PaginationButton
            disabled={!hasPrevious}
            href={getPageHref(previousPage)}
            rel="prev"
            aria-label={hasPrevious ? `Go to page ${previousPage}` : undefined}
          >
            ← Previous
          </PaginationButton>
          <PaginationButton
            disabled={!hasNext}
            href={getPageHref(nextPage)}
            rel="next"
            aria-label={hasNext ? `Go to page ${nextPage}` : undefined}
          >
            Next →
          </PaginationButton>
        </div>
      </nav>
    </div>
  );
}
