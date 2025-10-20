"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type UIEvent,
} from "react";

import { usePageTransition } from "@/hooks/usePageTransition";
import type { StormQuote } from "@/lib/storm";

const BATCH_SIZE = 12;
const INITIAL_BATCHES = 6;
const LOAD_THRESHOLD = 240;
const SCROLL_IDLE_DELAY = 320;
const SCROLL_ANIMATION_DURATION = 900;
const MIN_SCROLL_DELTA_FOR_RESET = 0.5;

const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

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
  const recenteringRef = useRef(false);
  const itemRefs = useRef(new Map<number, HTMLDivElement | null>());
  const scrollAnimationFrameRef = useRef<number | null>(null);
  const highlightedIdRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef(0);

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
      if (scrollAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollAnimationFrameRef.current);
        scrollAnimationFrameRef.current = null;
      }
      suppressScrollHandlingRef.current = false;
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
        lastScrollTopRef.current = container.scrollTop;
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

  const cancelScrollAnimation = useCallback(() => {
    if (scrollAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollAnimationFrameRef.current);
      scrollAnimationFrameRef.current = null;
    }
    recenteringRef.current = false;
    suppressScrollHandlingRef.current = false;
  }, []);

  const resolveTargetScrollTop = useCallback(
    (node: HTMLDivElement, container: HTMLDivElement) => {
      const containerHeight = container.clientHeight;
      if (containerHeight <= 0) {
        return container.scrollTop;
      }

      let accumulatedTop = 0;
      let current: HTMLElement | null = node;

      while (current && current !== container) {
        accumulatedTop += current.offsetTop;
        current = current.offsetParent as HTMLElement | null;
      }

      if (current !== container) {
        const containerRect = container.getBoundingClientRect();
        const nodeRect = node.getBoundingClientRect();
        return (
          container.scrollTop +
          (nodeRect.top - containerRect.top) +
          nodeRect.height / 2 -
          containerHeight / 2
        );
      }

      return (
        accumulatedTop +
        node.offsetHeight / 2 -
        containerHeight / 2
      );
    },
    []
  );

  const animateContainerToNode = useCallback(
    (node: HTMLDivElement) => {
      const container = containerRef.current;
      if (!container) {
        recenteringRef.current = false;
        return;
      }

      const startTop = container.scrollTop;
      const initialTarget = resolveTargetScrollTop(node, container);

      if (Math.abs(initialTarget - startTop) < 0.5) {
        suppressScrollHandlingRef.current = true;
        container.scrollTop = initialTarget;
        lastScrollTopRef.current = container.scrollTop;
        requestAnimationFrame(() => {
          recenteringRef.current = false;
          suppressScrollHandlingRef.current = false;
        });
        return;
      }

      cancelScrollAnimation();
      suppressScrollHandlingRef.current = true;

      const startTime = performance.now();
      const targetTop = initialTarget;

      const finish = () => {
        const host = containerRef.current;
        if (!host) {
          recenteringRef.current = false;
          return;
        }
        scrollAnimationFrameRef.current = null;
        requestAnimationFrame(() => {
          recenteringRef.current = false;
          suppressScrollHandlingRef.current = false;
        });
      };

      const step = (timestamp: number) => {
        const host = containerRef.current;
        if (!host) {
          cancelScrollAnimation();
          return;
        }

        const elapsed = timestamp - startTime;
        const progress = Math.min(1, elapsed / SCROLL_ANIMATION_DURATION);
        const eased = easeOutQuint(progress);

        const nextTop = startTop + (targetTop - startTop) * eased;
        const remaining = Math.abs(targetTop - nextTop);

        if (progress >= 1 || remaining <= 0.35) {
          host.scrollTop = targetTop;
          lastScrollTopRef.current = host.scrollTop;
          finish();
          return;
        }

        host.scrollTop = nextTop;
        lastScrollTopRef.current = host.scrollTop;
        scrollAnimationFrameRef.current = window.requestAnimationFrame(step);
      };

      scrollAnimationFrameRef.current = window.requestAnimationFrame(step);
    },
    [cancelScrollAnimation, resolveTargetScrollTop]
  );

  const applyHighlightToCenter = useCallback(
    (options?: { animate?: boolean }) => {
      const container = containerRef.current;
      if (!container) {
        cancelScrollAnimation();
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
        cancelScrollAnimation();
        highlightedIdRef.current = null;
        setHighlightedId(null);
        setDepthActive(false);
        return;
      }

      if (highlightedIdRef.current !== nearestId) {
        setHighlightedId(nearestId);
      }
      highlightedIdRef.current = nearestId;
      setDepthActive(true);

      if (options?.animate) {
        const node = itemRefs.current.get(nearestId);
        if (node) {
          recenteringRef.current = true;
          window.requestAnimationFrame(() => {
            animateContainerToNode(node);
          });
        } else {
          recenteringRef.current = false;
        }
      }
    },
    [animateContainerToNode, cancelScrollAnimation]
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
    if (!pointerActiveRef.current) {
      return;
    }

    pointerActiveRef.current = false;

    if (pendingHighlightRef.current || highlightedIdRef.current === null) {
      pendingHighlightRef.current = false;
      scheduleIdleHighlight();
    }
  }, [scheduleIdleHighlight]);

  const handlePointerDown = useCallback(() => {
    pointerActiveRef.current = true;

    if (scrollIdleTimeoutRef.current !== null) {
      window.clearTimeout(scrollIdleTimeoutRef.current);
      scrollIdleTimeoutRef.current = null;
    }

    cancelScrollAnimation();
  }, [cancelScrollAnimation]);

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
    lastScrollTopRef.current = container.scrollTop;
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
      const target = event.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = target;
      const previousTop = lastScrollTopRef.current;
      lastScrollTopRef.current = scrollTop;
      const delta = Math.abs(scrollTop - previousTop);

      if (!ready || loading || pool.length === 0) {
        return;
      }

      if (suppressScrollHandlingRef.current) {
        return;
      }

      cancelScrollAnimation();

      if (scrollTop < LOAD_THRESHOLD) {
        load("up");
      }

      if (scrollHeight - (scrollTop + clientHeight) < LOAD_THRESHOLD) {
        load("down");
      }

      if (recenteringRef.current) {
        return;
      }

      if (delta < MIN_SCROLL_DELTA_FOR_RESET) {
        return;
      }

      highlightedIdRef.current = null;
      setHighlightedId(null);
      setDepthActive(false);

      scheduleIdleHighlight();
    },
    [
      cancelScrollAnimation,
      load,
      loading,
      pool.length,
      ready,
      scheduleIdleHighlight,
    ]
  );

  useEffect(() => {
    if (!ready || items.length === 0 || initialHighlightRef.current) {
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

      suppressScrollHandlingRef.current = true;
      const targetTop = resolveTargetScrollTop(node, container);
      container.scrollTop = targetTop;

      requestAnimationFrame(() => {
        suppressScrollHandlingRef.current = false;
        applyHighlightToCenter();
      });
    };

    requestAnimationFrame(focusSelected);
  }, [applyHighlightToCenter, items, ready, resolveTargetScrollTop]);

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
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onPointerLeave={handlePointerLeave}
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

  const baseWrapperClasses =
    "max-w-3xl text-center font-sans text-[1.5rem] font-bold leading-[1.7] sm:text-[1.9rem] md:text-[2.15rem]";

  const textSpanClasses =
    "inline-block whitespace-pre-line transition-all duration-500 ease-out will-change-filter will-change-transform";

  const highlightedClasses = highlighted
    ? "storm-quote-highlight text-violet-300"
    : depthActive
    ? "text-zinc-500/60 blur-[4px] opacity-[0.35] saturate-[0.4]"
    : "text-zinc-100";

  return (
    <article
      ref={setRefs}
      className={`flex justify-center px-6 py-8 transition-transform duration-500 ease-out ${
        highlighted ? "scale-[1.05]" : depthActive ? "scale-[0.94]" : "scale-[1]"
      } overflow-visible`}
    >
      <p className={baseWrapperClasses}>
        <span className={`${textSpanClasses} ${highlightedClasses}`}>{text}</span>
      </p>
    </article>
  );
}
