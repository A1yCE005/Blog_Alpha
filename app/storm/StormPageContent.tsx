"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent,
} from "react";

import { usePageTransition } from "@/hooks/usePageTransition";
import type { StormQuote } from "@/lib/storm";

const BATCH_SIZE = 12;
const INITIAL_BATCHES = 6;
const LOAD_THRESHOLD = 240;

type StormPoolQuote = StormQuote & {
  poolIndex: number;
  baseHue: number;
};

type StormSample = StormQuote & {
  poolIndex: number;
  hue: number;
};

type StormItem = StormSample & {
  id: number;
};

type StormPageContentProps = {
  quotes: StormQuote[];
};

export function StormPageContent({ quotes }: StormPageContentProps) {
  const { isTransitioning, handleLinkClick } = usePageTransition("storm");
  const isInteractive = !isTransitioning;

  const containerRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef(0);
  const previousHeightRef = useRef(0);
  const shouldRestoreScrollRef = useRef(false);
  const loadTimeoutRef = useRef<number | null>(null);
  const hasSeededRef = useRef(false);

  const [items, setItems] = useState<StormItem[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const pool = useMemo<StormPoolQuote[]>(() => {
    return quotes.map((quote, index) => ({
      ...quote,
      poolIndex: index,
      baseHue: Math.round((index * 137.508) % 360),
    }));
  }, [quotes]);

  const poolSignature = useMemo(() => {
    return JSON.stringify(
      quotes.map((quote) => [quote.text, quote.author ?? "", quote.source ?? ""])
    );
  }, [quotes]);

  useEffect(() => {
    sequenceRef.current = 0;
    if (pool.length === 0) {
      setItems([]);
      setReady(true);
      hasSeededRef.current = true;
    } else {
      setItems([]);
      setReady(false);
      hasSeededRef.current = false;
    }
  }, [poolSignature, pool.length]);

  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current !== null) {
        window.clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, []);

  const attach = useCallback((entries: StormSample[]): StormItem[] => {
    return entries.map((entry) => ({
      ...entry,
      id: sequenceRef.current++,
    }));
  }, []);

  const sample = useCallback((): StormSample => {
    const index = Math.floor(Math.random() * pool.length);
    const base = pool[index]!;
    const hueJitter = (Math.random() - 0.5) * 24;
    const hue = (base.baseHue + hueJitter + 360) % 360;

    return {
      text: base.text,
      author: base.author,
      source: base.source,
      poolIndex: base.poolIndex,
      hue,
    } satisfies StormSample;
  }, [pool]);

  const createEntries = useCallback(
    (count: number) => {
      if (pool.length === 0) {
        return [] as StormSample[];
      }
      return Array.from({ length: count }, () => sample());
    },
    [pool.length, sample]
  );

  useEffect(() => {
    if (pool.length === 0) {
      return;
    }

    if (hasSeededRef.current) {
      return;
    }

    const seeds = attach(createEntries(BATCH_SIZE * INITIAL_BATCHES));
    hasSeededRef.current = true;
    setItems(seeds);

    requestAnimationFrame(() => {
      const container = containerRef.current;
      if (container) {
        container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
      }
      setReady(true);
    });
  }, [attach, createEntries, pool.length]);

  useEffect(() => {
    if (!shouldRestoreScrollRef.current) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      shouldRestoreScrollRef.current = false;
      return;
    }

    const delta = container.scrollHeight - previousHeightRef.current;
    container.scrollTop += delta;
    shouldRestoreScrollRef.current = false;
  }, [items]);

  const load = useCallback(
    (direction: "up" | "down") => {
      if (loading || !ready || pool.length === 0) {
        return;
      }

      const entries = createEntries(BATCH_SIZE);
      if (entries.length === 0) {
        return;
      }

      const attached = attach(entries);
      const container = containerRef.current;

      if (direction === "up" && container) {
        previousHeightRef.current = container.scrollHeight;
        shouldRestoreScrollRef.current = true;
      }

      setLoading(true);
      setItems((current) =>
        direction === "down" ? [...current, ...attached] : [...attached, ...current]
      );

      if (loadTimeoutRef.current !== null) {
        window.clearTimeout(loadTimeoutRef.current);
      }

      loadTimeoutRef.current = window.setTimeout(() => {
        setLoading(false);
        loadTimeoutRef.current = null;
      }, 100);
    },
    [attach, createEntries, loading, pool.length, ready]
  );

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (!ready || loading || pool.length === 0) {
        return;
      }

      const target = event.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = target;

      if (scrollTop < LOAD_THRESHOLD) {
        load("up");
      }

      if (scrollHeight - (scrollTop + clientHeight) < LOAD_THRESHOLD) {
        load("down");
      }
    },
    [load, loading, pool.length, ready]
  );

  const rerollItem = useCallback(
    (id: number) => {
      if (pool.length === 0) {
        return;
      }
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...sample(), id } : item))
      );
    },
    [pool.length, sample]
  );

  return (
    <>
      <div
        aria-hidden
        className={`page-transition-overlay ${
          isTransitioning ? "page-transition-overlay-active" : ""
        }`}
      />
      <div
        className={`relative min-h-screen bg-black page-fade-in transition-opacity duration-300 ease-out ${
          isTransitioning ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="mx-auto w-full max-w-5xl px-6 py-20 sm:px-10">
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

          {pool.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-zinc-950/40 p-16 text-center text-sm text-zinc-400">
              No storm quotes available yet. Add entries to
              <code className="mx-2 rounded bg-zinc-900 px-2 py-1 text-[0.75rem] text-zinc-200">
                content/posts/storm/storm.md
              </code>
              to start the squall.
            </div>
          ) : (
            <div className="relative">
              <div
                ref={containerRef}
                onScroll={handleScroll}
                className="storm-scroll-container relative flex h-[70vh] flex-col overflow-y-auto rounded-[2.5rem] border border-white/10 bg-zinc-950/80 p-6 shadow-[0_40px_120px_-40px_rgba(94,76,255,0.45)] sm:h-[75vh]"
              >
                <div className="flex flex-col gap-6">
                  {items.map((item) => (
                    <StormQuoteCard key={item.id} item={item} onReenter={() => rerollItem(item.id)} />
                  ))}
                </div>
                {loading && (
                  <div className="py-6 text-center text-xs font-semibold uppercase tracking-[0.45em] text-zinc-500">
                    Cycling…
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

type StormQuoteCardProps = {
  item: StormItem;
  onReenter: () => void;
};

function StormQuoteCard({ item, onReenter }: StormQuoteCardProps) {
  const { text, author, source, hue, poolIndex } = item;
  const cardRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef(false);
  const visibleRef = useRef(false);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nowVisible = entry.isIntersecting;
        if (nowVisible && !visibleRef.current && seenRef.current) {
          onReenter();
        }
        if (nowVisible) {
          seenRef.current = true;
        }
        visibleRef.current = nowVisible;
      },
      { threshold: 0.2 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [onReenter]);

  const gradientStyle = useMemo(() => {
    const secondaryHue = (hue + 32) % 360;
    return {
      background:
        `radial-gradient(circle at 20% 20%, hsl(${hue} 80% 22% / 0.4), transparent 55%), ` +
        `radial-gradient(circle at 80% 10%, hsl(${secondaryHue} 80% 20% / 0.35), transparent 60%), ` +
        `linear-gradient(135deg, hsl(${hue} 70% 14% / 0.8), hsl(${secondaryHue} 70% 10% / 0.85))`,
    };
  }, [hue]);

  return (
    <article
      ref={cardRef}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70 p-8 shadow-[0_30px_80px_-45px_rgba(86,76,255,0.6)] transition-transform duration-500 ease-out hover:-translate-y-1"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60" style={gradientStyle} />
      <div className="relative flex flex-col gap-6">
        <p className="text-xs font-semibold uppercase tracking-[0.45em] text-zinc-500">
          Storm pool #{String(poolIndex + 1).padStart(2, "0")}
        </p>
        <p className="text-lg leading-relaxed text-zinc-100 whitespace-pre-line sm:text-xl">
          {text}
        </p>
        {(author || source) && (
          <p className="text-sm font-medium text-zinc-300">
            <span className="uppercase tracking-[0.3em] text-zinc-500">—</span>{" "}
            {author}
            {author && source ? " · " : ""}
            {source}
          </p>
        )}
      </div>
    </article>
  );
}
