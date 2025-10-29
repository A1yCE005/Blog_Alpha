"use client";

import React from "react";
import Link from "next/link";

import type { PostSummary } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { usePageTransition } from "@/hooks/usePageTransition";

type BlogMainProps = {
  visible: boolean;
  posts: PostSummary[];
  layoutSeed: number;
};

type ShowcaseLayout = {
  colSpan: number;
  rowSpan: number;
  translateXRem: number;
  translateYRem: number;
  rotateDeg: number;
  scale: number;
  delayMs: number;
  zIndex: number;
};

type AccentTheme = {
  key: string;
  cardClassName: string;
  glowClassName: string;
};

type ShowcaseEntry = {
  post: PostSummary;
  layout: ShowcaseLayout;
  accent: AccentTheme;
};

const ACCENT_THEMES: AccentTheme[] = [
  {
    key: "violet",
    cardClassName:
      "border-violet-400/40 from-violet-500/10 via-zinc-950/35 to-zinc-950/80 shadow-[0_60px_200px_-80px_rgba(167,139,250,0.85)]",
    glowClassName: "bg-violet-500/35",
  },
  {
    key: "cyan",
    cardClassName:
      "border-cyan-400/40 from-sky-500/10 via-zinc-950/30 to-zinc-950/70 shadow-[0_60px_200px_-90px_rgba(56,189,248,0.8)]",
    glowClassName: "bg-sky-400/30",
  },
  {
    key: "emerald",
    cardClassName:
      "border-emerald-400/40 from-emerald-500/10 via-zinc-950/25 to-zinc-950/70 shadow-[0_60px_200px_-90px_rgba(52,211,153,0.75)]",
    glowClassName: "bg-emerald-400/30",
  },
  {
    key: "amber",
    cardClassName:
      "border-amber-300/40 from-amber-400/12 via-zinc-950/35 to-zinc-950/75 shadow-[0_60px_200px_-80px_rgba(251,191,36,0.6)]",
    glowClassName: "bg-amber-300/25",
  },
  {
    key: "rose",
    cardClassName:
      "border-rose-400/40 from-rose-500/12 via-zinc-950/35 to-zinc-950/70 shadow-[0_60px_210px_-85px_rgba(244,114,182,0.75)]",
    glowClassName: "bg-rose-400/25",
  },
];

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = Math.imul(state ^ (state >>> 15), 1 | state);
    state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng<T>(input: T[], rng: () => number) {
  for (let i = input.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [input[i], input[j]] = [input[j], input[i]];
  }
}

function randomBetween(rng: () => number, min: number, max: number) {
  return min + (max - min) * rng();
}

function pickLayout(rng: () => number): ShowcaseLayout {
  const colSpanOptions = [3, 3, 4, 4, 5];
  const rowSpanOptions = [3, 3, 4, 5];
  const colSpan = colSpanOptions[Math.floor(rng() * colSpanOptions.length)];
  const rowSpan = rowSpanOptions[Math.floor(rng() * rowSpanOptions.length)];

  return {
    colSpan,
    rowSpan,
    translateXRem: randomBetween(rng, -1.6, 1.6),
    translateYRem: randomBetween(rng, -1.4, 1.4),
    rotateDeg: randomBetween(rng, -4.5, 4.5),
    scale: randomBetween(rng, 0.9, 1.08),
    delayMs: Math.floor(randomBetween(rng, 0, 280)),
    zIndex: 10 + Math.floor(randomBetween(rng, 0, 12)),
  };
}

function buildShowcaseEntries(posts: PostSummary[], seed: number): ShowcaseEntry[] {
  if (posts.length === 0) {
    return [];
  }

  const rng = createSeededRandom(seed);
  const pool = [...posts];
  shuffleWithRng(pool, rng);

  const maxCount = Math.min(posts.length, 8);
  const minCount = Math.min(posts.length, 6);
  const countRange = Math.max(0, maxCount - minCount);
  const targetCount = minCount === 0 ? Math.min(posts.length, 3) : minCount + Math.floor(rng() * (countRange + 1));
  const selected = pool.slice(0, targetCount || Math.min(posts.length, 4));

  const accentPalette = [...ACCENT_THEMES];
  shuffleWithRng(accentPalette, rng);

  return selected.map((post, index) => {
    const accent = accentPalette[index % accentPalette.length];
    return {
      post,
      accent,
      layout: pickLayout(rng),
    };
  });
}

export function BlogMain({ visible, posts, layoutSeed }: BlogMainProps) {
  const { isTransitioning, handleLinkClick } = usePageTransition("home");
  const isInteractive = visible && !isTransitioning;
  const showcaseEntries = React.useMemo(
    () => buildShowcaseEntries(posts, layoutSeed),
    [posts, layoutSeed]
  );

  const hasPosts = showcaseEntries.length > 0;

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

          {hasPosts ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-6 lg:hidden">
                {showcaseEntries.map(({ post }) => (
                  <PostCard
                    key={`mobile-${post.slug}`}
                    post={post}
                    href={`/posts/${post.slug}`}
                    onClick={(event) => handleLinkClick(event, `/posts/${post.slug}`)}
                    tabIndex={isInteractive ? undefined : -1}
                  />
                ))}
              </div>

              <div
                className={`relative hidden min-h-[760px] rounded-[42px] border border-white/5 bg-white/5 p-10 lg:grid ${
                  isInteractive ? "opacity-100" : "opacity-70"
                }`}
                style={{
                  gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
                  gridAutoRows: "minmax(150px, 1fr)",
                  gap: "2.5rem",
                }}
              >
                {showcaseEntries.map(({ post, layout, accent }) => {
                  const href = `/posts/${post.slug}`;
                  const transform = `translate3d(${layout.translateXRem}rem, ${layout.translateYRem}rem, 0) rotate(${layout.rotateDeg}deg) scale(${layout.scale})`;

                  return (
                    <div
                      key={post.slug}
                      className={`group/card relative transition-all duration-700 ease-out will-change-transform ${
                        isInteractive ? "" : "saturate-75"
                      }`}
                      style={{
                        gridColumn: `span ${layout.colSpan} / span ${layout.colSpan}`,
                        gridRow: `span ${layout.rowSpan} / span ${layout.rowSpan}`,
                        transform,
                        zIndex: layout.zIndex,
                        transitionDelay: `${layout.delayMs}ms`,
                      }}
                    >
                      <div
                        aria-hidden
                        className={`pointer-events-none absolute inset-0 -z-10 blur-3xl opacity-40 transition-opacity duration-700 ease-out group-hover/card:opacity-65 ${accent.glowClassName}`}
                        style={{
                          transform: "translate3d(0, 0, 0)",
                          transitionDelay: `${layout.delayMs}ms`,
                        }}
                      />

                      <PostCard
                        post={post}
                        href={href}
                        onClick={(event) => handleLinkClick(event, href)}
                        tabIndex={isInteractive ? undefined : -1}
                        className="h-full"
                        variant="showcase"
                        cardClassName={`${accent.cardClassName} ${
                          isInteractive ? "" : "pointer-events-none"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
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
