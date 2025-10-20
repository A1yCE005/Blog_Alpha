"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { usePageTransition } from "@/hooks/usePageTransition";
import type { StormQuote } from "@/lib/storm";

type StormPageContentProps = {
  quotes: StormQuote[];
};

type StormVisualSeed = {
  poolIndex: number;
  quote: StormQuote;
  gradientFrom: string;
  gradientTo: string;
  accent: string;
  minHeight: number;
};

type StormListItem = StormVisualSeed & { id: number };

const SEED_MULTIPLIER = 6;
const BATCH_SIZE = 18;

export function StormPageContent({ quotes }: StormPageContentProps) {
  const { isTransitioning, handleLinkClick } = usePageTransition("storm");
  const isInteractive = !isTransitioning;

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
        <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:px-10">
          <div className="mb-10">
            <Link
              href="/?view=blog"
              onClick={(event) => handleLinkClick(event, "/?view=blog")}
              className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.35em] text-zinc-500 transition-colors duration-200 hover:text-violet-200"
              tabIndex={isInteractive ? undefined : -1}
            >
              <span aria-hidden>←</span> Back to main blog
            </Link>
          </div>
          {quotes.length > 0 ? (
            <InfiniteQuoteStream quotes={quotes} />
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center text-sm text-zinc-400">
              Storm is quiet for now. Add quotes to <code>content/posts/storm/storm.md</code> to wake it up.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

type InfiniteQuoteStreamProps = {
  quotes: StormQuote[];
};

type Direction = "up" | "down";

function InfiniteQuoteStream({ quotes }: InfiniteQuoteStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef(0);
  const previousHeightRef = useRef(0);
  const restoreScrollRef = useRef(false);
  const quotesRef = useRef(quotes);

  useEffect(() => {
    quotesRef.current = quotes;
  }, [quotes]);

  const [items, setItems] = useState<StormListItem[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const sampleQuote = useCallback(() => {
    const pool = quotesRef.current;
    if (pool.length === 0) {
      return { index: 0, quote: { text: "The Storm library is empty." } satisfies StormQuote };
    }
    const index = Math.floor(Math.random() * pool.length);
    return { index, quote: pool[index]! };
  }, []);

  const createSeed = useCallback((): StormVisualSeed => {
    const { index, quote } = sampleQuote();
    const baseHue = (index * 47) % 360;
    const fromLightness = 18 + ((index * 23) % 18);
    const toLightness = fromLightness + 12;
    const gradientFrom = `hsl(${baseHue} 58% ${fromLightness}%)`;
    const gradientTo = `hsl(${(baseHue + 20) % 360} 65% ${toLightness}%)`;
    const accent = `hsl(${baseHue} 85% 70%)`;
    const textLengthScore = Math.min(quote.text.replace(/\s+/g, "").length, 320);
    const baseHeight = 180;
    const growth = Math.floor(textLengthScore / 3.5);
    const contextBonus = quote.context ? 32 : 0;
    const minHeight = Math.max(200, Math.min(360, baseHeight + growth + contextBonus));

    return {
      poolIndex: index,
      quote,
      gradientFrom,
      gradientTo,
      accent,
      minHeight,
    } satisfies StormVisualSeed;
  }, [sampleQuote]);

  const attachSeeds = useCallback(
    (seeds: StormVisualSeed[], reuseId?: number): StormListItem[] => {
      if (typeof reuseId === "number" && seeds.length === 1) {
        return [{ ...seeds[0]!, id: reuseId }];
      }
      return seeds.map((seed) => ({ ...seed, id: sequenceRef.current++ }));
    },
    []
  );

  const fetchSeeds = useCallback(
    async (count: number) => Array.from({ length: count }, () => createSeed()),
    [createSeed]
  );

  const load = useCallback(
    async (direction: Direction) => {
      if (loading || !ready || quotesRef.current.length === 0) {
        return;
      }
      setLoading(true);
      try {
        const seeds = await fetchSeeds(BATCH_SIZE);
        if (direction === "down") {
          const attached = attachSeeds(seeds);
          setItems((current) => [...current, ...attached]);
          return;
        }

        const container = containerRef.current;
        if (container) {
          previousHeightRef.current = container.scrollHeight;
          restoreScrollRef.current = true;
        }
        const attached = attachSeeds(seeds);
        setItems((current) => [...attached, ...current]);
      } finally {
        setLoading(false);
      }
    },
    [attachSeeds, fetchSeeds, loading, ready]
  );

  useEffect(() => {
    if (quotes.length === 0) {
      setItems([]);
      setReady(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const seeds = await fetchSeeds(BATCH_SIZE * SEED_MULTIPLIER);
      if (cancelled) {
        return;
      }
      const attached = attachSeeds(seeds);
      setItems(attached);
      requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) {
          return;
        }
        container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
        setReady(true);
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [attachSeeds, fetchSeeds, quotes.length]);

  useEffect(() => {
    if (!restoreScrollRef.current) {
      return;
    }
    const container = containerRef.current;
    if (!container) {
      restoreScrollRef.current = false;
      return;
    }
    const heightDelta = container.scrollHeight - previousHeightRef.current;
    container.scrollTop += heightDelta;
    restoreScrollRef.current = false;
  }, [items]);

  const refreshItem = useCallback(
    (index: number) => {
      setItems((current) => {
        const target = current[index];
        if (!target) {
          return current;
        }
        const [seed] = attachSeeds([createSeed()], target.id);
        const next = [...current];
        next[index] = seed;
        return next;
      });
    },
    [attachSeeds, createSeed]
  );

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || !ready || loading || quotesRef.current.length === 0) {
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollTop < 220) {
      void load("up");
    }
    if (scrollHeight - (scrollTop + clientHeight) < 220) {
      void load("down");
    }
  }, [load, loading, ready]);

  return (
    <div
      className="h-[calc(100vh-12rem)] min-h-[28rem] overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950/70 pr-2 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60 sm:pr-3"
      ref={containerRef}
      onScroll={handleScroll}
    >
      <div className="flex min-h-full flex-col gap-6 px-6 py-8 sm:px-10">
        {items.map((item, index) => (
          <QuoteCard key={item.id} item={item} onReenter={() => refreshItem(index)} />
        ))}
        {loading && quotesRef.current.length > 0 && (
          <div className="py-4 text-center text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
            Loading…
          </div>
        )}
      </div>
    </div>
  );
}

type QuoteCardProps = {
  item: StormListItem;
  onReenter: () => void;
};

function QuoteCard({ item, onReenter }: QuoteCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const seenRef = useRef(false);
  const isIntersectingRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nowIntersecting = entry.isIntersecting;
        if (nowIntersecting && !isIntersectingRef.current && seenRef.current) {
          onReenter();
        }
        if (nowIntersecting) {
          seenRef.current = true;
        }
        isIntersectingRef.current = nowIntersecting;
      },
      { threshold: 0.08 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [onReenter]);

  const { quote, gradientFrom, gradientTo, accent, minHeight } = item;

  return (
    <article
      ref={ref}
      style={{
        minHeight,
        background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
        boxShadow: `0 24px 60px rgba(0, 0, 0, 0.45)`,
      }}
      className="group relative flex flex-col justify-between gap-6 rounded-3xl border border-white/10 px-7 py-8 text-left transition-transform duration-500 ease-out hover:-translate-y-1 sm:px-10 sm:py-12"
    >
      <div className="flex flex-col gap-4">
        <p className="text-lg font-medium leading-relaxed text-zinc-100 sm:text-xl">
          “{quote.text}”
        </p>
        {quote.context && (
          <p className="text-sm text-zinc-200/80 sm:text-base">
            {quote.context}
          </p>
        )}
      </div>
      <footer className="flex flex-col gap-2 text-sm text-zinc-200/80 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-semibold uppercase tracking-[0.35em] text-zinc-100/80">
          {quote.source ?? "Storm"}
        </span>
        {quote.link && (
          <a
            href={quote.link}
            target="_blank"
            rel="noreferrer"
            className="self-start text-xs font-semibold uppercase tracking-[0.35em] text-white/80 transition-colors duration-200 hover:text-white sm:self-end"
            style={{ color: accent }}
          >
            Open link
          </a>
        )}
      </footer>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl border border-white/0 transition-colors duration-500 group-hover:border-white/20"
      />
    </article>
  );
}
