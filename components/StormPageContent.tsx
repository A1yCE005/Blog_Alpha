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

const BATCH_SIZE = 18;
const INITIAL_BATCH_MULTIPLIER = 6;
const SCROLL_THRESHOLD = 200;
const DEFAULT_QUOTES: StormQuote[] = [
  {
    text: "Static air never ships a story. Ride the gusts until the signal comes through.",
    attribution: "Studio Log",
  },
];

type StormPageContentProps = {
  quotes: StormQuote[];
};

type StormItem = {
  id: number;
  logicalIndex: number;
};

function positiveModulo(n: number, mod: number) {
  return ((n % mod) + mod) % mod;
}

function buildItems(startIndex: number, count: number): StormItem[] {
  return Array.from({ length: count }, (_, index) => {
    const logicalIndex = startIndex + index;
    return { id: logicalIndex, logicalIndex } satisfies StormItem;
  });
}

function getQuoteColor(index: number) {
  const hue = (index * 47) % 360;
  const start = `hsl(${hue} 70% 18% / 0.85)`;
  const end = `hsl(${(hue + 30) % 360} 60% 12% / 0.9)`;
  return { start, end };
}

type QuoteCardProps = {
  quote: StormQuote;
  index: number;
  loop: number;
};

function QuoteCard({ quote, index, loop }: QuoteCardProps) {
  const { start, end } = getQuoteColor(index + loop * 7);

  return (
    <article className="relative overflow-hidden rounded-3xl border border-white/10 px-6 py-8 shadow-[0_30px_80px_rgba(76,29,149,0.18)] transition-transform duration-500 hover:-translate-y-1">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{ background: `linear-gradient(135deg, ${start}, ${end})` }}
      />
      <div className="relative flex flex-col gap-5 text-zinc-100">
        <p className="text-lg leading-relaxed text-zinc-100 sm:text-xl">{quote.text}</p>
        <div className="flex flex-col gap-1 text-xs uppercase tracking-[0.3em] text-zinc-300/90">
          {quote.attribution && <span>{quote.attribution}</span>}
          {quote.source && <span className="tracking-[0.2em] text-zinc-400">{quote.source}</span>}
        </div>
        {quote.note && <p className="text-sm text-zinc-300/80">{quote.note}</p>}
      </div>
    </article>
  );
}

export function StormPageContent({ quotes }: StormPageContentProps) {
  const safeQuotes = useMemo(() => {
    const cleaned = quotes
      .map((quote) => ({
        text: typeof quote.text === "string" ? quote.text.trim() : "",
        attribution: typeof quote.attribution === "string" ? quote.attribution.trim() : undefined,
        source: typeof quote.source === "string" ? quote.source.trim() : undefined,
        note: typeof quote.note === "string" ? quote.note.trim() : undefined,
      }))
      .filter((quote) => quote.text.length > 0);

    if (cleaned.length > 0) {
      return cleaned;
    }

    return DEFAULT_QUOTES;
  }, [quotes]);

  const containerRef = useRef<HTMLDivElement>(null);
  const nextDownRef = useRef(0);
  const nextUpRef = useRef(0);
  const pendingPrependScrollHeightRef = useRef<number | null>(null);
  const [items, setItems] = useState<StormItem[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const { isTransitioning, handleLinkClick } = usePageTransition("storm");
  const isInteractive = !isTransitioning;

  useEffect(() => {
    setReady(false);
    setLoading(false);
    loadingRef.current = false;

    const totalItems = BATCH_SIZE * INITIAL_BATCH_MULTIPLIER;
    const initialStart = -Math.floor(totalItems / 2);
    const initialItems = buildItems(initialStart, totalItems);

    nextDownRef.current = initialStart + totalItems;
    nextUpRef.current = initialStart - BATCH_SIZE;
    pendingPrependScrollHeightRef.current = null;

    setItems(initialItems);

    const frame = requestAnimationFrame(() => {
      const element = containerRef.current;
      if (element) {
        element.scrollTop = (element.scrollHeight - element.clientHeight) / 2;
      }
      setReady(true);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [safeQuotes]);

  useEffect(() => {
    if (pendingPrependScrollHeightRef.current === null) {
      return;
    }

    const element = containerRef.current;
    if (!element) {
      pendingPrependScrollHeightRef.current = null;
      return;
    }

    const previousHeight = pendingPrependScrollHeightRef.current;
    pendingPrependScrollHeightRef.current = null;
    const heightDelta = element.scrollHeight - previousHeight;
    element.scrollTop += heightDelta;
  }, [items]);

  const appendItems = useCallback((direction: "up" | "down") => {
    const element = containerRef.current;

    if (direction === "down") {
      const start = nextDownRef.current;
      const batch = buildItems(start, BATCH_SIZE);
      nextDownRef.current += BATCH_SIZE;
      setItems((current) => [...current, ...batch]);
      return;
    }

    if (element) {
      pendingPrependScrollHeightRef.current = element.scrollHeight;
    }
    const start = nextUpRef.current;
    const batch = buildItems(start, BATCH_SIZE);
    nextUpRef.current -= BATCH_SIZE;
    setItems((current) => [...batch, ...current]);
  }, []);

  const load = useCallback(
    (direction: "up" | "down") => {
      if (loadingRef.current || !ready) {
        return;
      }
      loadingRef.current = true;
      setLoading(true);
      appendItems(direction);
      requestAnimationFrame(() => {
        loadingRef.current = false;
        setLoading(false);
      });
    },
    [appendItems, ready]
  );

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (loadingRef.current || !ready) {
        return;
      }
      const element = event.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = element;
      if (scrollTop < SCROLL_THRESHOLD) {
        load("up");
      }
      if (scrollHeight - (scrollTop + clientHeight) < SCROLL_THRESHOLD) {
        load("down");
      }
    },
    [load, ready]
  );

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
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-20 sm:px-10">
          <div>
            <Link
              href="/?view=blog"
              onClick={(event) => handleLinkClick(event, "/?view=blog")}
              className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.35em] text-zinc-500 transition-colors duration-200 hover:text-violet-200"
              tabIndex={isInteractive ? undefined : -1}
            >
              <span aria-hidden>←</span> Back to the main blog
            </Link>
          </div>

          <div className="relative flex-1 overflow-hidden rounded-[2.25rem] border border-white/10 bg-zinc-950/60 backdrop-blur">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black via-black/20 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div
              ref={containerRef}
              onScroll={handleScroll}
              className="storm-quotes-scroll h-[65vh] min-h-[420px] w-full overflow-y-auto px-6 py-10 sm:h-[70vh]"
            >
              <div className="flex flex-col gap-6">
                {items.map((item) => {
                  const quoteIndex = positiveModulo(item.logicalIndex, safeQuotes.length);
                  const quote = safeQuotes[quoteIndex]!;
                  const loop = Math.floor(item.logicalIndex / safeQuotes.length);
                  return <QuoteCard key={item.id} quote={quote} index={quoteIndex} loop={loop} />;
                })}
                {loading && (
                  <div className="py-4 text-center text-sm uppercase tracking-[0.3em] text-zinc-500">Brewing more lightning…</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
