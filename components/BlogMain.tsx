"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { CSSProperties } from "react";

import type { PostSummary } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { usePageTransition } from "@/hooks/usePageTransition";

const MIN_FEATURED_POSTS = 6;
const MAX_FEATURED_POSTS = 8;

type ColSpan = 3 | 4 | 5 | 6;
type RowSpan = 1 | 2 | 3;

type LayoutSlot = {
  colSpan: ColSpan;
  rowSpan: RowSpan;
  offsetX?: number;
  offsetY?: number;
  rotation?: number;
  scale?: number;
  zIndexClass?: string;
  extraClasses?: string;
};

type FeaturedCard = {
  post: PostSummary;
  layout: LayoutSlot;
};

const COL_SPAN_CLASS_MAP: Record<ColSpan, string> = {
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
};

const ROW_SPAN_CLASS_MAP: Record<RowSpan, string> = {
  1: "md:row-span-1",
  2: "md:row-span-2",
  3: "md:row-span-3",
};

const LAYOUT_TEMPLATES: LayoutSlot[][] = [
  [
    { colSpan: 5, rowSpan: 2, offsetX: -12, offsetY: -6, rotation: -2.6, scale: 1.04, zIndexClass: "md:z-30" },
    { colSpan: 4, rowSpan: 1, offsetX: 8, offsetY: -10, rotation: 1.8, scale: 0.98, zIndexClass: "md:z-10" },
    { colSpan: 3, rowSpan: 1, offsetX: -20, offsetY: 6, rotation: -1.2, scale: 0.94, zIndexClass: "md:z-20" },
    { colSpan: 4, rowSpan: 2, offsetX: 16, offsetY: 4, rotation: 2.2, scale: 1.02, zIndexClass: "md:z-40" },
    { colSpan: 5, rowSpan: 1, offsetX: -6, offsetY: 18, rotation: -0.8, scale: 1.0, zIndexClass: "md:z-30", extraClasses: "md:self-end" },
    { colSpan: 3, rowSpan: 1, offsetX: 18, offsetY: 18, rotation: 1.1, scale: 0.96, zIndexClass: "md:z-20" },
    { colSpan: 4, rowSpan: 1, offsetX: -14, offsetY: 28, rotation: -1.4, scale: 1.0, zIndexClass: "md:z-30", extraClasses: "md:self-start" },
    { colSpan: 4, rowSpan: 1, offsetX: 10, offsetY: 32, rotation: 0.6, scale: 1.05, zIndexClass: "md:z-10" },
  ],
  [
    { colSpan: 4, rowSpan: 2, offsetX: -10, offsetY: -14, rotation: -3.2, scale: 1.06, zIndexClass: "md:z-40" },
    { colSpan: 4, rowSpan: 1, offsetX: 12, offsetY: -6, rotation: 1.6, scale: 0.96, zIndexClass: "md:z-20" },
    { colSpan: 4, rowSpan: 1, offsetX: -6, offsetY: 6, rotation: -0.6, scale: 1.02, zIndexClass: "md:z-30" },
    { colSpan: 6, rowSpan: 2, offsetX: 14, offsetY: 10, rotation: 2.4, scale: 1.04, zIndexClass: "md:z-30" },
    { colSpan: 3, rowSpan: 1, offsetX: -18, offsetY: 24, rotation: -1.1, scale: 0.94, zIndexClass: "md:z-20" },
    { colSpan: 3, rowSpan: 1, offsetX: 20, offsetY: 22, rotation: 1.4, scale: 0.98, zIndexClass: "md:z-10" },
    { colSpan: 4, rowSpan: 1, offsetX: -10, offsetY: 34, rotation: -0.8, scale: 1.08, zIndexClass: "md:z-40", extraClasses: "md:self-end" },
    { colSpan: 5, rowSpan: 1, offsetX: 16, offsetY: 32, rotation: 0.9, scale: 1.0, zIndexClass: "md:z-20" },
  ],
  [
    { colSpan: 6, rowSpan: 2, offsetX: -8, offsetY: -8, rotation: -1.8, scale: 1.08, zIndexClass: "md:z-40" },
    { colSpan: 3, rowSpan: 1, offsetX: 14, offsetY: -14, rotation: 2.4, scale: 0.92, zIndexClass: "md:z-10" },
    { colSpan: 3, rowSpan: 1, offsetX: -18, offsetY: 4, rotation: -0.5, scale: 1.0, zIndexClass: "md:z-30" },
    { colSpan: 4, rowSpan: 2, offsetX: 18, offsetY: 8, rotation: 3, scale: 1.02, zIndexClass: "md:z-30" },
    { colSpan: 4, rowSpan: 1, offsetX: -10, offsetY: 20, rotation: -1.5, scale: 0.96, zIndexClass: "md:z-20" },
    { colSpan: 3, rowSpan: 1, offsetX: 18, offsetY: 22, rotation: 1.1, scale: 1.04, zIndexClass: "md:z-20" },
    { colSpan: 5, rowSpan: 1, offsetX: -4, offsetY: 34, rotation: -0.9, scale: 1.0, zIndexClass: "md:z-30", extraClasses: "md:self-center" },
    { colSpan: 4, rowSpan: 1, offsetX: 12, offsetY: 36, rotation: 0.4, scale: 0.98, zIndexClass: "md:z-10" },
  ],
];

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function shuffleArray<T>(input: T[]): T[] {
  const result = [...input];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function pickLayoutSlots(count: number): LayoutSlot[] {
  if (count <= 0) {
    return [];
  }

  const template = LAYOUT_TEMPLATES[Math.floor(Math.random() * LAYOUT_TEMPLATES.length)];
  const pool = shuffleArray(template);
  const slots: LayoutSlot[] = [];

  while (slots.length < count) {
    const next = pool[slots.length % pool.length];
    if (!next) {
      break;
    }
    slots.push({ ...next });
  }

  return slots;
}

function createFeaturedCards(posts: PostSummary[]): FeaturedCard[] {
  if (posts.length === 0) {
    return [];
  }

  const maxSelectable = Math.min(posts.length, MAX_FEATURED_POSTS);
  if (maxSelectable <= 0) {
    return [];
  }

  const count =
    maxSelectable <= MIN_FEATURED_POSTS
      ? maxSelectable
      : Math.min(maxSelectable, randomInt(MIN_FEATURED_POSTS, maxSelectable));
  const selectedPosts = shuffleArray(posts).slice(0, count);
  const layoutSlots = pickLayoutSlots(count);
  const fallbackLayout: LayoutSlot = {
    colSpan: 4,
    rowSpan: 1,
  };
  const effectiveLayouts = layoutSlots.length > 0 ? layoutSlots : [fallbackLayout];

  return selectedPosts.map((post, index) => ({
    post,
    layout: { ...effectiveLayouts[index % effectiveLayouts.length] },
  }));
}

type BlogMainProps = {
  visible: boolean;
  posts: PostSummary[];
};

export function BlogMain({ visible, posts }: BlogMainProps) {
  const { isTransitioning, handleLinkClick } = usePageTransition("home");
  const isInteractive = visible && !isTransitioning;
  const featuredCards = useMemo(() => createFeaturedCards(posts), [posts]);

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
              className={`relative flex flex-col gap-6 md:grid md:min-h-[32rem] md:grid-cols-12 md:grid-rows-[repeat(6,minmax(120px,auto))] md:gap-10 md:py-6`}
            >
              {featuredCards.map(({ post, layout }) => {
                const spanClasses = `${COL_SPAN_CLASS_MAP[layout.colSpan]} ${ROW_SPAN_CLASS_MAP[layout.rowSpan]}`;
                const transformVariables: CSSProperties = {
                  "--postcard-offset-x": layout.offsetX !== undefined ? `${layout.offsetX}%` : undefined,
                  "--postcard-offset-y": layout.offsetY !== undefined ? `${layout.offsetY}%` : undefined,
                  "--postcard-rotation": layout.rotation !== undefined ? `${layout.rotation}deg` : undefined,
                  "--postcard-scale": layout.scale !== undefined ? `${layout.scale}` : undefined,
                };

                return (
                  <div
                    key={post.slug}
                    style={transformVariables}
                    className={[
                      "relative",
                      "transition-[transform,opacity]",
                      "duration-700",
                      "ease-out",
                      "md:[transform:translate3d(var(--postcard-offset-x,0%),var(--postcard-offset-y,0%),0)_scale(var(--postcard-scale,1))_rotate(var(--postcard-rotation,0deg))]",
                      isInteractive ? "pointer-events-auto" : "pointer-events-none",
                      visible ? "opacity-100" : "opacity-70 md:opacity-90",
                      spanClasses,
                      layout.zIndexClass ?? "",
                      layout.extraClasses ?? "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <PostCard
                      post={post}
                      href={`/posts/${post.slug}`}
                      onClick={(event) => handleLinkClick(event, `/posts/${post.slug}`)}
                      tabIndex={isInteractive ? undefined : -1}
                      className="h-full min-h-[14rem] bg-gradient-to-br from-zinc-950/80 via-zinc-950/40 to-zinc-950/90 backdrop-blur"
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
