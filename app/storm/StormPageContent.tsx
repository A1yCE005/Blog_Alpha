"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
  type UIEvent,
} from "react";

import { usePageTransition } from "@/hooks/usePageTransition";
import type { StormQuote } from "@/lib/storm";

const BATCH_SIZE = 12;
const INITIAL_BATCHES = 6;
const LOAD_THRESHOLD = 240;
const SCROLL_IDLE_DELAY = 320;
const SCROLL_ANIMATION_DURATION = 520;

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
  const pointerActiveRef = useRef(false);
  const pendingHighlightRef = useRef(false);
  const initialHighlightRef = useRef(false);
  const itemRefs = useRef(new Map<number, HTMLDivElement | null>());
  const highlightedIdRef = useRef<number | null>(null);
  const activeTouchCountRef = useRef(0);
  const scrollAnimationFrameRef = useRef<number | null>(null);
  const scrollAnimatingRef = useRef(false);

  const [items, setItems] = useState<StormItem[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [depthActive, setDepthActive] = useState(false);

  useEffect(() => {
    highlightedIdRef.current = highlightedId;
  }, [highlightedId]);

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

  const stopScrollAnimation = useCallback(() => {
    if (scrollAnimationFrameRef.current !== null) {
      cancelAnimationFrame(scrollAnimationFrameRef.current);
      scrollAnimationFrameRef.current = null;
    }

    if (scrollAnimatingRef.current) {
      scrollAnimatingRef.current = false;
      suppressScrollHandlingRef.current = false;
    }
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
      stopScrollAnimation();
      suppressScrollHandlingRef.current = false;
    };
  }, [stopScrollAnimation]);

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
    highlightedIdRef.current = null;
    initialHighlightRef.current = false;
    itemRefs.current.clear();
  }, [poolSignature, pool.length]);

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

  const resolveTargetScrollTop = useCallback((node: HTMLDivElement, container: HTMLDivElement) => {
    const containerHeight = container.clientHeight;
    if (containerHeight <= 0) {
      return container.scrollTop;
    }

    const target = node.offsetTop + node.offsetHeight / 2 - containerHeight / 2;
    const maxScroll = container.scrollHeight - containerHeight;

    if (!Number.isFinite(target)) {
      return container.scrollTop;
    }

    return Math.min(Math.max(target, 0), maxScroll);
  }, []);

  const scrollContainerTo = useCallback(
    (container: HTMLDivElement, target: number, animate: boolean) => {
      stopScrollAnimation();

      if (!Number.isFinite(target)) {
        return;
      }

      const currentTop = container.scrollTop;
      const distance = target - currentTop;

      if (!animate || Math.abs(distance) <= 0.5) {
        suppressScrollHandlingRef.current = true;
        container.scrollTop = target;
        requestAnimationFrame(() => {
          suppressScrollHandlingRef.current = false;
        });
        return;
      }

      scrollAnimatingRef.current = true;
      suppressScrollHandlingRef.current = true;
      const start = performance.now();
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

      const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(Math.max(elapsed / SCROLL_ANIMATION_DURATION, 0), 1);
        const next = currentTop + distance * easeOutCubic(progress);
        container.scrollTop = next;

        if (progress < 1) {
          scrollAnimationFrameRef.current = requestAnimationFrame(step);
        } else {
          scrollAnimationFrameRef.current = null;
          scrollAnimatingRef.current = false;
          container.scrollTop = target;
          requestAnimationFrame(() => {
            suppressScrollHandlingRef.current = false;
          });
        }
      };

      scrollAnimationFrameRef.current = requestAnimationFrame(step);
    },
    [stopScrollAnimation]
  );

  const applyHighlightToCenter = useCallback(
    (options?: { animate?: boolean }) => {
      const animate = options?.animate ?? true;

      const container = containerRef.current;
      if (!container) {
        highlightedIdRef.current = null;
        setHighlightedId(null);
        setDepthActive(false);
        return;
      }

      if (pointerActiveRef.current) {
        pendingHighlightRef.current = true;
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
        highlightedIdRef.current = null;
        setHighlightedId(null);
        setDepthActive(false);
        return;
      }

      const node = itemRefs.current.get(nearestId);

      if (node) {
        const targetTop = resolveTargetScrollTop(node, container);
        scrollContainerTo(container, targetTop, animate);
      }

      highlightedIdRef.current = nearestId;
      setHighlightedId(nearestId);
      setDepthActive(true);
    },
    [resolveTargetScrollTop, scrollContainerTo]
  );

  const scheduleIdleHighlight = useCallback(() => {
    if (scrollIdleTimeoutRef.current !== null) {
      window.clearTimeout(scrollIdleTimeoutRef.current);
    }

    scrollIdleTimeoutRef.current = window.setTimeout(() => {
      scrollIdleTimeoutRef.current = null;

      if (pointerActiveRef.current) {
        pendingHighlightRef.current = true;
        return;
      }

      pendingHighlightRef.current = false;
      applyHighlightToCenter({ animate: true });
    }, SCROLL_IDLE_DELAY);
  }, [applyHighlightToCenter]);

  const settlePointerInteraction = useCallback(() => {
    if (activeTouchCountRef.current > 0) {
      return;
    }

    if (!pointerActiveRef.current) {
      return;
    }

    pointerActiveRef.current = false;

    if (pendingHighlightRef.current || highlightedIdRef.current === null) {
      pendingHighlightRef.current = false;
      scheduleIdleHighlight();
    }
  }, [scheduleIdleHighlight]);

  const beginPointerInteraction = useCallback(() => {
    stopScrollAnimation();
    pointerActiveRef.current = true;

    if (scrollIdleTimeoutRef.current !== null) {
      window.clearTimeout(scrollIdleTimeoutRef.current);
      scrollIdleTimeoutRef.current = null;
    }

  }, [stopScrollAnimation]);

  const handlePointerDown = useCallback(() => {
    beginPointerInteraction();
  }, [beginPointerInteraction]);

  const handlePointerUp = useCallback(() => {
    settlePointerInteraction();
  }, [settlePointerInteraction]);

  const handlePointerCancel = useCallback(() => {
    settlePointerInteraction();
  }, [settlePointerInteraction]);

  const handlePointerLeave = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.buttons === 0) {
        settlePointerInteraction();
      }
    },
    [settlePointerInteraction]
  );

  const handleTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      activeTouchCountRef.current = event.touches.length;
      beginPointerInteraction();
    },
    [beginPointerInteraction]
  );

  const handleTouchEnd = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      activeTouchCountRef.current = event.touches.length;

      if (event.touches.length === 0) {
        settlePointerInteraction();
      }
    },
    [settlePointerInteraction]
  );

  const handleTouchCancel = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      activeTouchCountRef.current = event.touches.length;

      if (event.touches.length === 0) {
        settlePointerInteraction();
      }
    },
    [settlePointerInteraction]
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
      applyHighlightToCenter({ animate: false });
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

      const target = event.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = target;

      if (scrollTop < LOAD_THRESHOLD) {
        load("up");
      }

      if (scrollHeight - (scrollTop + clientHeight) < LOAD_THRESHOLD) {
        load("down");
      }

      highlightedIdRef.current = null;
      setHighlightedId(null);
      setDepthActive(false);

      if (pointerActiveRef.current) {
        pendingHighlightRef.current = true;
        if (scrollIdleTimeoutRef.current !== null) {
          window.clearTimeout(scrollIdleTimeoutRef.current);
          scrollIdleTimeoutRef.current = null;
        }
        return;
      }

      scheduleIdleHighlight();
    },
    [load, loading, pool.length, ready, scheduleIdleHighlight]
  );

  useEffect(() => {
    if (!ready || items.length === 0 || initialHighlightRef.current || isTransitioning) {
      return;
    }

    initialHighlightRef.current = true;

    const container = containerRef.current;
    if (!container) {
      highlightedIdRef.current = null;
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

      const targetTop = resolveTargetScrollTop(node, container);
      scrollContainerTo(container, targetTop, false);

      requestAnimationFrame(() => {
        applyHighlightToCenter({ animate: false });
      });
    };

    requestAnimationFrame(focusSelected);
  }, [
    applyHighlightToCenter,
    isTransitioning,
    items,
    ready,
    resolveTargetScrollTop,
    scrollContainerTo,
  ]);

  const rerollItem = useCallback(
    (id: number) => {
      if (pool.length === 0) {
        return;
      }

      if (highlightedIdRef.current === id) {
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
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onPointerLeave={handlePointerLeave}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
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
  const highlightedRef = useRef(highlighted);

  useEffect(() => {
    highlightedRef.current = highlighted;
  }, [highlighted]);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nowVisible = entry.isIntersecting;
        if (nowVisible && !visibleRef.current && seenRef.current && !highlightedRef.current) {
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

  const baseWrapperClasses =
    "max-w-3xl text-center font-sans text-[1.5rem] font-bold leading-[1.7] sm:text-[1.9rem] md:text-[2.15rem]";

  const textSpanClasses = "storm-quote-body inline-block whitespace-pre-line";

  const highlightedClasses = highlighted
    ? "text-violet-300"
    : depthActive
    ? "text-zinc-500/60 blur-[4px] opacity-[0.35] saturate-[0.4]"
    : "text-zinc-100";

  return (
    <article ref={setRefs} className="flex justify-center px-6 py-8 overflow-visible">
      <p className={baseWrapperClasses}>
        <span className={`${textSpanClasses} ${highlightedClasses}`}>{text}</span>
      </p>
    </article>
  );
}
