"use client";

import Link from "next/link";
import { useMemo, useState, type MouseEvent, type ReactNode } from "react";

import { PostCard } from "@/components/PostCard";
import type { PostSummary } from "@/lib/posts";
import { usePageTransition } from "@/hooks/usePageTransition";

type TagSummary = {
  name: string;
  count: number;
};

type ArchivePageContentProps = {
  posts: PostSummary[];
  allPosts: PostSummary[];
  page: number;
  lastPage: number;
  hasPrevious: boolean;
  hasNext: boolean;
  previousHref: string;
  nextHref: string;
  topTags: TagSummary[];
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
  allPosts,
  page,
  lastPage,
  hasPrevious,
  hasNext,
  previousHref,
  nextHref,
  topTags,
}: ArchivePageContentProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const isFiltering = Boolean(selectedTag);
  const filteredPosts = useMemo(() => {
    if (!selectedTag) {
      return posts;
    }
    return allPosts.filter((post) => post.tags.includes(selectedTag));
  }, [allPosts, posts, selectedTag]);

  const activePage = isFiltering ? 1 : page;
  const activeLastPage = isFiltering ? 1 : lastPage;
  const activeHasPrevious = isFiltering ? false : hasPrevious;
  const activeHasNext = isFiltering ? false : hasNext;

  const getArchivePageHref = (pageNumber: number) =>
    pageNumber <= 1 ? "/archive" : `/archive?page=${pageNumber}`;

  const activePreviousHref = activeHasPrevious
    ? previousHref
    : getArchivePageHref(activePage);
  const activeNextHref = activeHasNext ? nextHref : getArchivePageHref(activePage);

  const resetKey = selectedTag ? `archive:tag:${selectedTag}` : `archive:${activePage}`;
  const { isTransitioning, handleLinkClick } = usePageTransition(resetKey);
  const isInteractive = !isTransitioning;

  const toggleTag = (tag: string) => {
    if (!isInteractive) {
      return;
    }
    setSelectedTag((current) => (current === tag ? null : tag));
  };

  const clearFilter = () => {
    if (!isInteractive) {
      return;
    }
    setSelectedTag(null);
  };

  const hasFilters = topTags.length > 0;
  const showEmptyState = filteredPosts.length === 0;

  const archiveLinkSearch = new URLSearchParams({ from: "archive" });
  if (activePage > 1) {
    archiveLinkSearch.set("archivePage", String(activePage));
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
            {hasFilters && (
              <div className="mt-2 flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Filter by tag</span>
                <div className="flex flex-wrap gap-2">
                  {topTags.map((tag) => {
                    const isActive = selectedTag === tag.name;
                    return (
                      <button
                        key={tag.name}
                        type="button"
                        onClick={() => toggleTag(tag.name)}
                        disabled={!isInteractive}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                          isActive
                            ? "border-violet-400/80 bg-violet-500/10 text-violet-200"
                            : "border-white/10 text-zinc-400 hover:border-violet-400/60 hover:text-violet-200"
                        } ${!isInteractive ? "cursor-not-allowed opacity-60" : ""}`}
                      >
                        <span>#{tag.name}</span>
                        <span className="text-[0.65rem] text-zinc-500">{tag.count}</span>
                      </button>
                    );
                  })}
                  {selectedTag && (
                    <button
                      type="button"
                      onClick={clearFilter}
                      disabled={!isInteractive}
                      className={`inline-flex items-center rounded-full border border-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 transition-colors duration-200 hover:border-zinc-400/60 hover:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                        !isInteractive ? "cursor-not-allowed opacity-60" : ""
                      }`}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </header>

          {!showEmptyState ? (
            <div className="flex flex-col gap-6">
              {filteredPosts.map((post) => {
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
              {selectedTag ? (
                <p>
                  No posts found for <span className="font-semibold text-zinc-200">#{selectedTag}</span> in the archive.
                </p>
              ) : (
                <p>
                  No posts found yet. Drop a markdown file into <code>content/posts</code> to get started.
                </p>
              )}
            </div>
          )}

          <nav
            aria-label="Archive pagination"
            className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-6"
          >
            <span className="text-sm text-zinc-400">
              Page {activePage} of {activeLastPage}
            </span>
            <div className="flex items-center gap-3">
              <PaginationButton
                disabled={!activeHasPrevious}
                href={activePreviousHref}
                rel="prev"
                aria-label={
                  activeHasPrevious ? `Go to page ${activePage - 1}` : undefined
                }
                onClick={
                  activeHasPrevious
                    ? (event) => handleLinkClick(event, activePreviousHref)
                    : undefined
                }
                tabIndex={isInteractive ? undefined : -1}
              >
                ← Previous
              </PaginationButton>
              <PaginationButton
                disabled={!activeHasNext}
                href={activeNextHref}
                rel="next"
                aria-label={
                  activeHasNext ? `Go to page ${activePage + 1}` : undefined
                }
                onClick={
                  activeHasNext
                    ? (event) => handleLinkClick(event, activeNextHref)
                    : undefined
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
