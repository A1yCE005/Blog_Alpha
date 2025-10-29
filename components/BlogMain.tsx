"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";

import type { PostSummary } from "@/lib/posts";
import { PostCard, type PostCardSize } from "@/components/PostCard";
import { usePageTransition } from "@/hooks/usePageTransition";

const MIN_FEATURED_POSTS = 6;
const MAX_FEATURED_POSTS = 8;

type LayoutSlot = {
  top: number;
  left: number;
};

const LAYOUT_SLOTS: LayoutSlot[] = [
  { top: 18, left: 26 },
  { top: 21, left: 58 },
  { top: 30, left: 82 },
  { top: 38, left: 36 },
  { top: 46, left: 64 },
  { top: 54, left: 18 },
  { top: 57, left: 84 },
  { top: 68, left: 42 },
  { top: 74, left: 68 },
  { top: 82, left: 24 },
  { top: 86, left: 52 },
  { top: 34, left: 14 }
];

const SIZE_SEQUENCE: PostCardSize[] = ["lg", "md", "md", "sm", "md", "lg", "sm", "md"];

type FloatingCardLayout = {
  post: PostSummary;
  size: PostCardSize;
  top: number;
  left: number;
  rotation: number;
  width: number;
  delay: number;
  zIndex: number;
};

const clamp = (value: number, min: number, max: number) => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const shuffleArray = <T,>(input: readonly T[]): T[] => {
  const array = [...input];
  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }
  return array;
};

const pickFloatingLayouts = (posts: PostSummary[]): FloatingCardLayout[] => {
  if (posts.length === 0) {
    return [];
  }

  const upperBound = Math.min(posts.length, MAX_FEATURED_POSTS);
  const lowerBound = Math.min(posts.length, MIN_FEATURED_POSTS);
  const countRange = upperBound - lowerBound;
  const count = upperBound === lowerBound ? upperBound : lowerBound + Math.floor(Math.random() * (countRange + 1));

  const selectedPosts = shuffleArray(posts).slice(0, count);
  const slotPool = shuffleArray(LAYOUT_SLOTS).slice(0, count);
  const sizePool = shuffleArray(
    Array.from({ length: count }, (_, index) => SIZE_SEQUENCE[index % SIZE_SEQUENCE.length] ?? "md")
  );

  return selectedPosts.map((post, index) => {
    const slot = slotPool[index] ?? { top: 50, left: 50 };
    const size = sizePool[index] ?? "md";
    const width = size === "lg" ? 360 : size === "sm" ? 240 : 300;
    const topJitter = (Math.random() - 0.5) * 12; // ±6
    const leftJitter = (Math.random() - 0.5) * 16; // ±8

    return {
      post,
      size,
      top: clamp(slot.top + topJitter, 10, 90),
      left: clamp(slot.left + leftJitter, 12, 88),
      rotation: (Math.random() - 0.5) * 10, // ±5deg
      width,
      delay: Math.round(Math.random() * 220 + index * 45),
      zIndex: 20 + index
    };
  });
};

type BlogMainProps = {
  visible: boolean;
  posts: PostSummary[];
};

export function BlogMain({ visible, posts }: BlogMainProps) {
  const { isTransitioning, handleLinkClick } = usePageTransition("home");
  const isInteractive = visible && !isTransitioning;
  const [floatingPosts] = useState(() => pickFloatingLayouts(posts));

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

          {floatingPosts.length > 0 ? (
            <>
              <div
                aria-hidden={!visible}
                className={`relative hidden min-h-[50rem] w-full transition-opacity duration-500 ease-out md:block ${
                  visible ? "opacity-100" : "opacity-0"
                } ${
                  isInteractive ? "pointer-events-auto" : "pointer-events-none"
                }`}
              >
                {floatingPosts.map((item) => {
                  const wrapperStyle: CSSProperties = {
                    top: `${item.top}%`,
                    left: `${item.left}%`,
                    width: `${item.width}px`,
                    zIndex: item.zIndex
                  };
                  const rotationStyle: CSSProperties = {
                    ["--tw-rotate" as "--tw-rotate"]: `${item.rotation}deg`
                  };
                  const animationStyle: CSSProperties = {
                    transitionDelay: `${item.delay}ms`
                  };

                  return (
                    <div key={item.post.slug} className="absolute" style={wrapperStyle}>
                      <div className="transform -translate-x-1/2 -translate-y-1/2" style={rotationStyle}>
                        <div
                          className={`transform transition-all duration-700 ease-out ${
                            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                          } ${isInteractive ? "pointer-events-auto" : "pointer-events-none"}`}
                          style={animationStyle}
                        >
                          <PostCard
                            post={item.post}
                            href={`/posts/${item.post.slug}`}
                            onClick={(event) => handleLinkClick(event, `/posts/${item.post.slug}`)}
                            tabIndex={isInteractive ? undefined : -1}
                            aria-hidden={!visible}
                            variant="floating"
                            size={item.size}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                className={`flex flex-col gap-6 transition-opacity duration-500 ease-out md:hidden ${
                  visible ? "opacity-100" : "opacity-0"
                } ${
                  isInteractive ? "pointer-events-auto" : "pointer-events-none"
                }`}
              >
                {floatingPosts.map((item, index) => (
                  <PostCard
                    key={item.post.slug}
                    post={item.post}
                    href={`/posts/${item.post.slug}`}
                    onClick={(event) => handleLinkClick(event, `/posts/${item.post.slug}`)}
                    tabIndex={isInteractive ? undefined : -1}
                    aria-hidden={!visible}
                    variant="default"
                    size={index === 0 ? "lg" : "md"}
                  />
                ))}
              </div>
            </>
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
