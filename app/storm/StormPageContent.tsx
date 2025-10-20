"use client";

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
};

type StormSample = StormQuote & {
  poolIndex: number;
};

type StormItem = StormSample & {
  id: number;
};

type StormPageContentProps = {
  quotes: StormQuote[];
};

export function StormPageContent({ quotes }: StormPageContentProps) {
  const { isTransitioning } = usePageTransition("storm");
  const isInteractive = !isTransitioning;

  const containerRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef(0);
  const previousHeightRef = useRef(0);
  const shouldRestoreScrollRef = useRef(false);
  const loadTimeoutRef = useRef<number | null>(null);
  const hasSeededRef = useRef(false);
  const scrollIdleTimeoutRef = useRef<number | null>(null);
  const suppressScrollHandlingRef = useRef(false);
  const scrollAnimationFrameRef = useRef<number | null>(null);
  const initialHighlightRef = useRef(false);
  const itemRefs = useRef(new Map<number, HTMLDivElement | null>());

  const [items, setItems] = useState<StormItem[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [depthActive, setDepthActive] = useState(false);

  const pool = useMemo<StormPoolQuote[]>(() => {
    return quotes.map((quote, index) => ({
      ...quote,
      poolIndex: index,
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
    setHighlightedId(null);
    setDepthActive(false);
    initialHighlightRef.current = false;
    itemRefs.current.clear();
  }, [poolSignature, pool.length]);

  const cancelScrollAnimation = useCallback(() => {
    if (scrollAnimationFrameRef.current !== null) {
      cancelAnimationFrame(scrollAnimationFrameRef.current);
      scrollAnimationFrameRef.current = null;
    }
    suppressScrollHandlingRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current !== null) {
        window.clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      if (scrollIdleTimeoutRef.current !== null) {
        window.clearTimeout(scrollIdleTimeoutRef.current);
        scrollIdleTimeoutRef.current = null;
      }
      cancelScrollAnimation();
    };
  }, [cancelScrollAnimation]);

  const attach = useCallback((entries: StormSample[]): StormItem[] => {
    return entries.map((entry) => ({
      ...entry,
      id: sequenceRef.current++,
    }));
  }, []);

  const sample = useCallback((): StormSample => {
    const index = Math.floor(Math.random() * pool.length);
    const base = pool[index]!;

    return {
      text: base.text,
      author: base.author,
      source: base.source,
      poolIndex: base.poolIndex,
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

  const registerItemNode = useCallback((id: number, node: HTMLDivElement | null) => {
    if (node) {
      itemRefs.current.set(id, node);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  const animateItemToCenter = useCallback(
    (id: number) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const node = itemRefs.current.get(id);
      if (!node) {
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const itemRect = node.getBoundingClientRect();
      const targetScrollTop =
        container.scrollTop +
        (itemRect.top - containerRect.top) +
        itemRect.height / 2 -
        container.clientHeight / 2;

      cancelScrollAnimation();

      const start = container.scrollTop;
      const delta = targetScrollTop - start;

      if (Math.abs(delta) < 0.5) {
        container.scrollTop = targetScrollTop;
        return;
      }

      const duration = 720;
      const easeInOutCubic = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      let startTime: number | null = null;
      suppressScrollHandlingRef.current = true;

      const step = (timestamp: number) => {
        if (startTime === null) {
          startTime = timestamp;
        }

        const elapsed = timestamp - startTime;
        const progress = Math.min(1, elapsed / duration);
        const eased = easeInOutCubic(progress);

        container.scrollTop = start + delta * eased;

        if (progress < 1) {
          scrollAnimationFrameRef.current = requestAnimationFrame(step);
        } else {
          container.scrollTop = targetScrollTop;
          suppressScrollHandlingRef.current = false;
          scrollAnimationFrameRef.current = null;
        }
      };

      scrollAnimationFrameRef.current = requestAnimationFrame(step);
    },
    [cancelScrollAnimation]
  );

  const applyHighlightToCenter = useCallback(
    (options?: { animate?: boolean }) => {
      const { animate = false } = options ?? {};
      const container = containerRef.current;
      if (!container) {
        setHighlightedId(null);
        setDepthActive(false);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 2;

      let nearestId: number | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;

      itemRefs.current.forEach((node, id) => {
        if (!node) {
          return;
        }

        const rect = node.getBoundingClientRect();
        const itemCenter = rect.top + rect.height / 2;
        const distance = Math.abs(itemCenter - containerCenter);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestId = id;
        }
      });

      if (nearestId === null) {
        setHighlightedId(null);
        setDepthActive(false);
        return;
      }

      setHighlightedId(nearestId);
      setDepthActive(true);

      if (animate) {
        requestAnimationFrame(() => {
          animateItemToCenter(nearestId);
        });
      }
    },
    [animateItemToCenter]
  );

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
    suppressScrollHandlingRef.current = true;
    container.scrollTop += delta;
    requestAnimationFrame(() => {
      suppressScrollHandlingRef.current = false;
      applyHighlightToCenter();
    });
    shouldRestoreScrollRef.current = false;
  }, [applyHighlightToCenter, items]);

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

      if (suppressScrollHandlingRef.current) {
        return;
      }

      cancelScrollAnimation();

      const target = event.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = target;

      if (scrollTop < LOAD_THRESHOLD) {
        load("up");
      }

      if (scrollHeight - (scrollTop + clientHeight) < LOAD_THRESHOLD) {
        load("down");
      }

      if (scrollIdleTimeoutRef.current !== null) {
        window.clearTimeout(scrollIdleTimeoutRef.current);
      }

      setHighlightedId(null);
      setDepthActive(false);

      scrollIdleTimeoutRef.current = window.setTimeout(() => {
        scrollIdleTimeoutRef.current = null;
        applyHighlightToCenter({ animate: true });
      }, 260);
    },
    [applyHighlightToCenter, cancelScrollAnimation, load, loading, pool.length, ready]
  );

  useEffect(() => {
    if (!ready || items.length === 0 || initialHighlightRef.current) {
      return;
    }

    initialHighlightRef.current = true;

    const container = containerRef.current;
    if (!container) {
      setHighlightedId(null);
      setDepthActive(false);
      return;
    }

    const randomIndex = Math.floor(Math.random() * items.length);
    const selected = items[randomIndex];

    if (!selected) {
      return;
    }

    const focusSelected = () => {
      const node = itemRefs.current.get(selected.id);
      if (!node) {
        requestAnimationFrame(focusSelected);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const itemRect = node.getBoundingClientRect();
      const delta =
        itemRect.top - containerRect.top + itemRect.height / 2 - container.clientHeight / 2;

      suppressScrollHandlingRef.current = true;
      container.scrollTop += delta;

      requestAnimationFrame(() => {
        suppressScrollHandlingRef.current = false;
        applyHighlightToCenter();
      });
    };

    requestAnimationFrame(focusSelected);
  }, [applyHighlightToCenter, items, ready]);

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
        <div className="mx-auto flex h-screen w-full max-w-4xl flex-col px-6 sm:px-12">
          {pool.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-zinc-950/40 p-16 text-center text-sm text-zinc-400">
              No storm quotes available yet. Add entries to
              <code className="mx-2 rounded bg-zinc-900 px-2 py-1 text-[0.75rem] text-zinc-200">
                content/posts/storm/storm.md
              </code>
              to start the squall.
            </div>
          ) : (
            <div
              ref={containerRef}
              onScroll={handleScroll}
              className="storm-scroll-container relative flex h-full flex-col overflow-y-auto px-2 sm:px-4"
              tabIndex={isInteractive ? 0 : -1}
            >
              <div className="flex flex-col items-center gap-16 py-16 sm:gap-24">
                {items.map((item) => (
                  <StormQuoteCard
                    key={item.id}
                    item={item}
                    onReenter={() => rerollItem(item.id)}
                    registerNode={(node) => registerItemNode(item.id, node)}
                    highlighted={highlightedId === item.id}
                    depthActive={depthActive}
                  />
                ))}
              </div>
              {loading && (
                <div className="pb-10 text-center text-xs font-semibold uppercase tracking-[0.45em] text-zinc-500">
                  Cycling…
                </div>
              )}
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
  registerNode: (node: HTMLDivElement | null) => void;
  highlighted: boolean;
  depthActive: boolean;
};

function StormQuoteCard({
  item,
  onReenter,
  registerNode,
  highlighted,
  depthActive,
}: StormQuoteCardProps) {
  const { text } = item;
  const cardRef = useRef<HTMLDivElement | null>(null);
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

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      cardRef.current = node;
      registerNode(node);
    },
    [registerNode]
  );

  const baseTextClasses =
    "max-w-3xl whitespace-pre-line text-center text-[1.9rem] font-bold leading-relaxed tracking-[0.01em] transition-all duration-500 ease-[cubic-bezier(0.16,0.84,0.44,1)] sm:text-[2.2rem]";

  const highlightedClasses = highlighted
    ? "text-violet-300 drop-shadow-[0_0_36px_rgba(167,139,250,0.65)]"
    : depthActive
    ? "text-zinc-500/60 blur-[1.8px] opacity-35 saturate-50"
    : "text-zinc-100";

  return (
    <article
      ref={setRefs}
      className={`flex justify-center px-6 py-6 transition-transform duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] ${
        highlighted ? "scale-[1.05]" : depthActive ? "scale-[0.94]" : "scale-[1]"
      }`}
    >
      <p className={`${baseTextClasses} ${highlightedClasses}`}>{text}</p>
    </article>
  );
}
