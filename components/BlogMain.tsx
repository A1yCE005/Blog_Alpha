"use client";

import React from "react";
import Link from "next/link";

import type { PostSummary } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { usePageTransition } from "@/hooks/usePageTransition";

type ScatterStyle = React.CSSProperties & {
  "--card-transform"?: string;
  "--card-transform-hover"?: string;
  "--card-filter"?: string;
  "--card-filter-hover"?: string;
  "--card-shadow"?: string;
  "--card-shadow-hover"?: string;
  "--card-accent"?: string;
  "--card-border"?: string;
  "--card-delay"?: string;
};

type ScatterCard = {
  post: PostSummary;
  style: ScatterStyle;
};

const ACCENT_PALETTE: ReadonlyArray<{
  accent: string;
  glow: string;
  border: string;
}> = [
  {
    accent: "rgba(167, 139, 250, 0.58)",
    glow: "rgba(167, 139, 250, 0.42)",
    border: "rgba(167, 139, 250, 0.28)",
  },
  {
    accent: "rgba(96, 165, 250, 0.58)",
    glow: "rgba(96, 165, 250, 0.42)",
    border: "rgba(96, 165, 250, 0.26)",
  },
  {
    accent: "rgba(56, 189, 248, 0.58)",
    glow: "rgba(56, 189, 248, 0.4)",
    border: "rgba(56, 189, 248, 0.24)",
  },
  {
    accent: "rgba(110, 231, 183, 0.55)",
    glow: "rgba(110, 231, 183, 0.38)",
    border: "rgba(110, 231, 183, 0.24)",
  },
  {
    accent: "rgba(244, 114, 182, 0.56)",
    glow: "rgba(244, 114, 182, 0.4)",
    border: "rgba(244, 114, 182, 0.28)",
  },
  {
    accent: "rgba(249, 115, 22, 0.54)",
    glow: "rgba(249, 115, 22, 0.38)",
    border: "rgba(249, 115, 22, 0.26)",
  },
];

const JUSTIFY_OPTIONS: ReadonlyArray<ScatterStyle["justifySelf"]> = ["start", "center", "end", "stretch"];
const ALIGN_OPTIONS: ReadonlyArray<ScatterStyle["alignSelf"]> = ["start", "center", "end", "stretch"];

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandomGenerator(seed: string): () => number {
  let state = hashSeed(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRandom<T>(input: readonly T[], random: () => number): T[] {
  const array = [...input];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j]!, array[i]!];
  }
  return array;
}

function createScatterLayout(posts: PostSummary[]): ScatterCard[] {
  if (posts.length === 0) {
    return [];
  }

  const seed = posts.map((post) => `${post.slug}:${post.date}`).join("|");
  const random = createRandomGenerator(seed);
  const randomInt = (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min;
  const randomFloat = (min: number, max: number) => random() * (max - min) + min;
  const sample = <T,>(input: readonly T[]) => input[Math.floor(random() * input.length)]!;

  const count = Math.min(posts.length, randomInt(6, 8));
  const selection = shuffleWithRandom(posts, random).slice(0, count);

  return selection.map((post, index) => {
    const accent = ACCENT_PALETTE[index % ACCENT_PALETTE.length]!;
    const colSpan = randomInt(4, 6);
    const rowSpan = randomInt(2, 3);
    const translateY = randomFloat(-1.25, 2.6);
    const rotate = randomFloat(-4.6, 4.6);
    const hoverTranslate = translateY - randomFloat(0.35, 0.95);
    const hoverRotate = rotate + randomFloat(-0.8, 0.8);
    const scale = randomFloat(0.92, 1.12);
    const hoverScale = Math.min(scale + randomFloat(0.04, 0.08), 1.18);
    const minHeight = randomFloat(18, 26);
    const opacity = randomFloat(0.86, 0.98);

    const style: ScatterStyle = {
      gridColumn: `span ${colSpan} / span ${colSpan}`,
      gridRow: `span ${rowSpan} / span ${rowSpan}`,
      minHeight: `${minHeight}rem`,
      opacity,
      zIndex: 20 + index,
      justifySelf: sample(JUSTIFY_OPTIONS),
      alignSelf: sample(ALIGN_OPTIONS),
      transitionDelay: `${index * 70}ms`,
    };

    style["--card-transform"] = `translate3d(0, ${translateY.toFixed(2)}rem, 0) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    style["--card-transform-hover"] = `translate3d(0, ${hoverTranslate.toFixed(2)}rem, 0) rotate(${hoverRotate.toFixed(2)}deg) scale(${hoverScale.toFixed(3)})`;
    style["--card-filter"] = `drop-shadow(0 55px 140px ${accent.glow})`;
    style["--card-filter-hover"] = `drop-shadow(0 70px 180px ${accent.accent})`;
    style["--card-shadow"] = `0 45px 140px -70px ${accent.glow}`;
    style["--card-shadow-hover"] = `0 60px 180px -70px ${accent.accent}`;
    style["--card-accent"] = accent.accent;
    style["--card-border"] = accent.border;
    style["--card-delay"] = `${index * 60}ms`;

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
  const scatterCards = React.useMemo(() => createScatterLayout(posts), [posts]);

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

          {scatterCards.length > 0 ? (
            <div
              className="relative flex flex-col gap-6 md:auto-rows-[minmax(14rem,auto)] md:grid md:grid-cols-12 md:gap-10"
            >
              {scatterCards.map(({ post, style }, index) => {
                const postHref = `/posts/${post.slug}`;
                return (
                  <div
                    key={post.slug}
                    style={style}
                    data-card-index={index}
                    className="group/card relative transition-[transform,opacity,filter] duration-700 ease-out md:[filter:var(--card-filter)] md:[transform:var(--card-transform)] md:[transition-delay:var(--card-delay)] md:hover:z-[80] md:hover:[filter:var(--card-filter-hover)] md:hover:[transform:var(--card-transform-hover)]"
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
