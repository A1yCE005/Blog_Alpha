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

type StormQuote = {
  text: string;
  attribution?: string;
  context?: string;
};

type StormListItem = StormQuote & {
  id: number;
  hue: number;
};

type StormPageContentProps = {
  quotes: StormQuote[];
};

const BATCH_SIZE = 18;
const INITIAL_BATCH_MULTIPLIER = 6;
const SCROLL_THRESHOLD = 200;

function createGradient(hue: number) {
  const primary = `hsl(${hue} 70% 16%)`;
  const secondary = `hsl(${(hue + 28) % 360} 80% 12%)`;
  const border = `hsl(${hue} 65% 32% / 0.35)`;
  return {
    backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})`,
    borderColor: border,
  };
}

export function StormPageContent({ quotes }: StormPageContentProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef(0);
  const previousHeightRef = useRef(0);
  const didPrependRef = useRef(false);
  const [items, setItems] = useState<StormListItem[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sampler = useMemo(() => {
    const normalized = quotes.filter((quote) => quote.text.trim().length > 0);
    const pool = normalized.length > 0 ? normalized : [{ text: "Storm archive is empty." }];
    return () => {
      const index = Math.floor(Math.random() * pool.length);
      return pool[index]!;
    };
  }, [quotes]);

  const attach = useCallback(
    (batch: StormQuote[]): StormListItem[] =>
      batch.map((quote) => {
        const id = sequenceRef.current++;
        const hue = (id * 47) % 360;
        return {
          ...quote,
          id,
          hue,
        };
      }),
    []
  );

  const makeBatch = useCallback(
    (size: number) => Array.from({ length: size }, () => ({ ...sampler() })),
    [sampler]
  );

  const loadMore = useCallback(
    (direction: "up" | "down") => {
      if (isLoading || !isReady) {
        return;
      }
      setIsLoading(true);
      const newItems = attach(makeBatch(BATCH_SIZE));
      const scheduleReset = () => {
        requestAnimationFrame(() => {
          setIsLoading(false);
        });
      };
      if (direction === "down") {
        setItems((current) => {
          scheduleReset();
          return [...current, ...newItems];
        });
        return;
      }

      const container = scrollRef.current;
      if (container) {
        previousHeightRef.current = container.scrollHeight;
        didPrependRef.current = true;
      }
      setItems((current) => {
        scheduleReset();
        return [...newItems, ...current];
      });
    },
    [attach, isLoading, isReady, makeBatch]
  );

  useEffect(() => {
    const seeds = attach(makeBatch(BATCH_SIZE * INITIAL_BATCH_MULTIPLIER));
    setItems(seeds);
    const container = scrollRef.current;
    if (!container) {
      setIsReady(true);
      return;
    }
    requestAnimationFrame(() => {
      const center = (container.scrollHeight - container.clientHeight) / 2;
      container.scrollTop = Number.isFinite(center) ? center : 0;
      setIsReady(true);
    });
  }, [attach, makeBatch]);

  useEffect(() => {
    if (!didPrependRef.current) {
      return;
    }
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    const heightDelta = container.scrollHeight - previousHeightRef.current;
    container.scrollTop += heightDelta;
    didPrependRef.current = false;
  }, [items]);

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (!isReady || isLoading) {
        return;
      }
      const target = event.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = target;
      if (scrollTop < SCROLL_THRESHOLD) {
        loadMore("up");
      } else if (scrollHeight - (scrollTop + clientHeight) < SCROLL_THRESHOLD) {
        loadMore("down");
      }
    },
    [isLoading, isReady, loadMore]
  );

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
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={`relative mx-auto flex h-screen w-full max-w-4xl flex-col overflow-y-auto px-6 pb-16 pt-12 sm:px-10 ${
            isInteractive ? "" : "pointer-events-none"
          }`}
        >
          <div className="sticky top-0 z-10 -mx-2 -mt-2 mb-6 bg-black/85 px-2 py-2 backdrop-blur">
            <Link
              href="/?view=blog"
              onClick={(event) => handleLinkClick(event, "/?view=blog")}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 transition-colors duration-200 hover:text-violet-200"
              tabIndex={isInteractive ? undefined : -1}
            >
              <span aria-hidden>←</span> Back to main blog
            </Link>
          </div>
          <div className="flex flex-col gap-6 pb-12">
            {items.map((item, index) => (
              <StormQuoteCard
                key={item.id}
                item={item}
                onReenter={() => {
                  setItems((current) => {
                    const next = [...current];
                    const existing = next[index];
                    if (!existing) {
                      return current;
                    }
                    const replacement = attach([{ ...sampler() }])[0]!;
                    next[index] = {
                      ...existing,
                      ...replacement,
                      id: existing.id,
                    };
                    return next;
                  });
                }}
              />
            ))}
            {isLoading && (
              <div className="py-4 text-center text-sm text-zinc-500">Gathering new fragments…</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

type StormQuoteCardProps = {
  item: StormListItem;
  onReenter: () => void;
};

function StormQuoteCard({ item, onReenter }: StormQuoteCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const hasBeenVisibleRef = useRef(false);
  const isVisibleRef = useRef(false);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nowVisible = entry.isIntersecting;
        if (nowVisible && !isVisibleRef.current && hasBeenVisibleRef.current) {
          onReenter();
        }
        if (nowVisible) {
          hasBeenVisibleRef.current = true;
        }
        isVisibleRef.current = nowVisible;
      },
      { threshold: 0.01 }
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [onReenter]);

  const gradientStyle = useMemo(() => createGradient(item.hue), [item.hue]);

  return (
    <article
      ref={cardRef}
      className="relative overflow-hidden rounded-3xl border px-7 py-8 shadow-lg shadow-black/60 transition-transform duration-500 ease-out hover:-translate-y-1"
      style={gradientStyle}
    >
      <div className="relative flex flex-col gap-5">
        <blockquote className="flex flex-col gap-4 text-lg leading-relaxed text-zinc-100 sm:text-xl">
          <span className="font-medium text-zinc-50">{item.text}</span>
          {(item.attribution || item.context) && (
            <footer className="flex flex-col gap-1 text-sm uppercase tracking-[0.3em] text-violet-200/80">
              {item.attribution && <span>{item.attribution}</span>}
              {item.context && <span className="tracking-[0.2em] text-violet-100/60">{item.context}</span>}
            </footer>
          )}
        </blockquote>
      </div>
    </article>
  );
}
