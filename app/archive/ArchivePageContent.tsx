"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

import { PostCard } from "@/components/PostCard";
import type { PostSummary } from "@/lib/posts";
import { usePageTransition } from "@/hooks/usePageTransition";

type ArchivePageContentProps = {
  posts: PostSummary[];
  page: number;
  lastPage: number;
  hasPrevious: boolean;
  hasNext: boolean;
  previousHref: string;
  nextHref: string;
};

type PaginationButtonProps = {
  disabled: boolean;
  href: string;
  children: ReactNode;
  rel?: "prev" | "next";
  "aria-label"?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  tabIndex?: number;
};

function PaginationButton({
  disabled,
  href,
  children,
  rel,
  onClick,
  tabIndex,
  "aria-label": ariaLabel,
}: PaginationButtonProps) {
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
    <Link
      href={href}
      rel={rel}
      aria-label={ariaLabel}
      className={baseClassName}
      onClick={onClick}
      tabIndex={tabIndex}
    >
      {children}
    </Link>
  );
}

export function ArchivePageContent({
  posts,
  page,
  lastPage,
  hasPrevious,
  hasNext,
  previousHref,
  nextHref,
}: ArchivePageContentProps) {
  const resetKey = `archive:${page}`;
  const { isTransitioning, handleLinkClick } = usePageTransition(resetKey);
  const isInteractive = !isTransitioning;

  const archiveLinkSearch = new URLSearchParams({ from: "archive" });
  if (page > 1) {
    archiveLinkSearch.set("archivePage", String(page));
  }

  const buildPostHref = (slug: string) => {
    const search = archiveLinkSearch.toString();
    return search ? `/posts/${slug}?${search}` : `/posts/${slug}`;
  };

  return (
    <>
      <div
        aria-hidden
        className={`page-transition-overlay ${isTransitioning ? "page-transition-overlay-active" : ""}`}
      />
      <div
        className={`relative min-h-screen bg-black page-fade-in transition-opacity duration-300 ease-out ${
          isTransitioning ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div
          className={`mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-10 px-6 py-16 transition-transform duration-300 ease-out sm:px-10 ${
            isInteractive ? "translate-y-0" : "translate-y-8"
          }`}
        >
          <Link
            href="/?view=blog"
            onClick={(event) => handleLinkClick(event, "/?view=blog")}
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.35em] text-zinc-500 transition-colors duration-200 hover:text-violet-200"
            tabIndex={isInteractive ? undefined : -1}
          >
            <span aria-hidden>←</span> Back to the cloud
          </Link>

          <header className="flex flex-col gap-3 text-left">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300/80">The Journal</p>
            <h1 className="text-3xl font-semibold text-zinc-50 sm:text-4xl">Archive</h1>
            <p className="max-w-2xl text-sm text-zinc-400 sm:text-base">
              Browse every post we&apos;ve published. Follow the full timeline of essays, signals, and experiments from the Letter Cloud studio.
            </p>
          </header>

          {posts.length > 0 ? (
            <div className="flex flex-col gap-6">
              {posts.map((post) => {
                const postHref = buildPostHref(post.slug);
                return (
                  <PostCard
                    key={post.slug}
                    post={post}
                    href={postHref}
                    onClick={(event) => handleLinkClick(event, postHref)}
                    tabIndex={isInteractive ? undefined : -1}
                  />
                );
              })}
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
                href={previousHref}
                rel="prev"
                aria-label={hasPrevious ? `Go to page ${page - 1}` : undefined}
                onClick={
                  hasPrevious
                    ? (event) => handleLinkClick(event, previousHref)
                    : undefined
                }
                tabIndex={isInteractive ? undefined : -1}
              >
                ← Previous
              </PaginationButton>
              <PaginationButton
                disabled={!hasNext}
                href={nextHref}
                rel="next"
                aria-label={hasNext ? `Go to page ${page + 1}` : undefined}
                onClick={
                  hasNext ? (event) => handleLinkClick(event, nextHref) : undefined
                }
                tabIndex={isInteractive ? undefined : -1}
              >
                Next →
              </PaginationButton>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
