"use client";

import React from "react";
import Link from "next/link";

import type { PostSummary } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { usePageTransition } from "@/hooks/usePageTransition";

type GridStyle = React.CSSProperties;

type GridCard = {
  post: PostSummary;
  style: GridStyle;
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(input: readonly T[]): T[] {
  const array = [...input];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j]!, array[i]!];
  }
  return array;
}

function createGridLayout(posts: PostSummary[]): GridCard[] {
  if (posts.length === 0) {
    return [];
  }

  const count = Math.min(posts.length, randomInt(6, 8));
  const selection = shuffle(posts).slice(0, count);

  return selection.map((post, index) => {
    const span = Math.min(
      12,
      Math.max(
        4,
        index === 0 ? randomInt(8, 12) : index < 3 ? randomInt(6, 8) : randomInt(4, 7)
      )
    );
    const rowSpan = index === 0 ? randomInt(3, 4) : randomInt(2, 3);

    const minHeight = (() => {
      if (rowSpan >= 4) {
        return randomInt(24, 28);
      }
      if (rowSpan === 3) {
        return randomInt(20, 24);
      }
      return randomInt(16, 20);
    })();

    const style: GridStyle = {
      gridColumn: `span ${span} / span ${span}`,
      gridRow: `span ${rowSpan} / span ${rowSpan}`,
      minHeight: `${minHeight}rem`,
      alignSelf: "stretch",
      justifySelf: "stretch",
    };

    return { post, style };
  });
}

type BlogMainProps = {
  visible: boolean;
  posts: PostSummary[];
};

export function BlogMain({ visible, posts }: BlogMainProps) {
  const { isTransitioning, handleLinkClick } = usePageTransition("home");
  const isInteractive = visible && !isTransitioning;
  const featuredCards = React.useMemo(() => createGridLayout(posts), [posts]);

  return (
    <>
      <div
        aria-hidden
        className={`page-transition-overlay ${isTransitioning ? "page-transition-overlay-active" : ""}`}
      />
      <div
        aria-hidden={!visible}
        className={`fixed inset-0 z-20 overflow-y-auto bg-gradient-to-b from-transparent via-black/60 to-black transition-opacity duration-300 ease-out ${
          visible ? "page-fade-in" : ""
        } ${
          isInteractive ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className={`mx-auto flex min-h-full w-full max-w-4xl flex-col gap-10 px-6 py-16 transition-transform duration-300 ease-out sm:px-10 ${
            isInteractive ? "translate-y-0" : "translate-y-8"
          }`}
        >
          <header className="flex flex-col gap-6 text-left">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300/80">The Journal</p>
              <h2 className="text-3xl font-semibold text-zinc-50 sm:text-4xl">Lighthosue</h2>
              <p className="max-w-2xl text-sm text-zinc-400 sm:text-base">
                Essays, signals, and experiments from the Letter Cloud studio. Click any post to keep the momentum of the particles going in your own practice.
              </p>
            </div>
            <nav className="flex flex-wrap items-center gap-3">
              <Link
                href="/archive"
                onClick={(event) => handleLinkClick(event, "/archive")}
                className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-zinc-200 transition-colors duration-200 hover:border-white/40 hover:text-white focus-visible:border-white/60 focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60"
                tabIndex={isInteractive ? undefined : -1}
              >
                Archive
              </Link>
              <Link
                href="/storm"
                onClick={(event) => handleLinkClick(event, "/storm")}
                className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-zinc-200 transition-colors duration-200 hover:border-white/40 hover:text-white focus-visible:border-white/60 focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60"
                tabIndex={isInteractive ? undefined : -1}
              >
                Storm
              </Link>
              <Link
                href="/about"
                onClick={(event) => handleLinkClick(event, "/about")}
                className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-zinc-200 transition-colors duration-200 hover:border-white/40 hover:text-white focus-visible:border-white/60 focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60"
                tabIndex={isInteractive ? undefined : -1}
              >
                About
              </Link>
            </nav>
          </header>

          {featuredCards.length > 0 ? (
            <div
              className="relative flex flex-col gap-6 md:auto-rows-[minmax(14rem,auto)] md:grid md:grid-cols-12 md:gap-10"
            >
              {featuredCards.map(({ post, style }, index) => {
                const postHref = `/posts/${post.slug}`;
                return (
                  <div
                    key={post.slug}
                    style={style}
                    data-card-index={index}
                    className="group/card relative h-full md:hover:z-[50]"
                  >
                    <PostCard
                      post={post}
                      href={postHref}
                      onClick={(event) => handleLinkClick(event, postHref)}
                      tabIndex={isInteractive ? undefined : -1}
                      aria-hidden={isInteractive ? undefined : true}
                      className="h-full"
                    />
                  </div>
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
        </div>
      </div>
    </>
  );
}
