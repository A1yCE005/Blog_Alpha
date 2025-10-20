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
  const isUserScrollingRef = useRef(false);
  const initialHighlightRef = useRef(false);
  const activeIdRef = useRef<number | null>(null);
  const itemElementsRef = useRef(new Map<number, HTMLDivElement>());
  const ignoreScrollEventsRef = useRef(false);

  const [items, setItems] = useState<StormItem[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  const depthEnabled = activeId !== null && !isUserScrolling;

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
      initialHighlightRef.current = false;
      activeIdRef.current = null;
      setActiveId(null);
      setIsUserScrolling(false);
    } else {
      setItems([]);
      setReady(false);
      hasSeededRef.current = false;
      initialHighlightRef.current = false;
      activeIdRef.current = null;
      setActiveId(null);
      setIsUserScrolling(false);
    }
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
        const target = (container.scrollHeight - container.clientHeight) / 2;
        if (!Number.isNaN(target)) {
          ignoreScrollEventsRef.current = true;
          container.scrollTop = target;
          requestAnimationFrame(() => {
            ignoreScrollEventsRef.current = false;
          });
        }
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
    if (delta !== 0) {
      ignoreScrollEventsRef.current = true;
      container.scrollTop += delta;
      requestAnimationFrame(() => {
        ignoreScrollEventsRef.current = false;
      });
    }
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

  const registerItemElement = useCallback((id: number, node: HTMLDivElement | null) => {
    if (node) {
      itemElementsRef.current.set(id, node);
    } else {
      itemElementsRef.current.delete(id);
    }
  }, []);

  const setActive = useCallback((id: number | null) => {
    activeIdRef.current = id;
    setActiveId(id);
  }, []);

  const focusNearest = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let closestId: number | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.top + container.clientHeight / 2;

    for (const [id, node] of itemElementsRef.current.entries()) {
      const rect = node.getBoundingClientRect();
      const nodeCenter = rect.top + rect.height / 2;
      const distance = Math.abs(nodeCenter - containerCenter);
      if (distance < closestDistance) {
        closestId = id;
        closestDistance = distance;
      }
    }

    if (closestId !== null) {
      setActive(closestId);
    } else {
      setActive(null);
    }
  }, [setActive]);

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (!ready || loading || pool.length === 0) {
        return;
      }

      if (ignoreScrollEventsRef.current) {
        return;
      }

      if (!isUserScrollingRef.current) {
        isUserScrollingRef.current = true;
        setIsUserScrolling(true);
        if (activeIdRef.current !== null) {
          setActive(null);
        }
      }

      if (scrollIdleTimeoutRef.current !== null) {
        window.clearTimeout(scrollIdleTimeoutRef.current);
      }

      scrollIdleTimeoutRef.current = window.setTimeout(() => {
        isUserScrollingRef.current = false;
        setIsUserScrolling(false);
        focusNearest();
      }, 220);

      const target = event.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = target;

      if (scrollTop < LOAD_THRESHOLD) {
        load("up");
      }

      if (scrollHeight - (scrollTop + clientHeight) < LOAD_THRESHOLD) {
        load("down");
      }
    },
    [focusNearest, load, loading, pool.length, ready, setActive]
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

  useEffect(() => {
    if (!ready || items.length === 0) {
      return;
    }

    if (initialHighlightRef.current) {
      return;
    }

    const targetIndex = Math.floor(Math.random() * items.length);
    const targetItem = items[targetIndex];
    if (!targetItem) {
      return;
    }

    initialHighlightRef.current = true;

    let attempts = 0;
    const focusInitial = () => {
      const container = containerRef.current;
      const node = itemElementsRef.current.get(targetItem.id);
      if (!container || !node) {
        if (attempts < 5) {
          attempts += 1;
          requestAnimationFrame(focusInitial);
        }
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      const delta =
        nodeRect.top -
        (containerRect.top + container.clientHeight / 2 - nodeRect.height / 2);

      if (Math.abs(delta) > 0.5) {
        ignoreScrollEventsRef.current = true;
        container.scrollTop += delta;
        requestAnimationFrame(() => {
          ignoreScrollEventsRef.current = false;
        });
      }

      requestAnimationFrame(() => {
        setActive(targetItem.id);
      });
    };

    requestAnimationFrame(focusInitial);
  }, [items, ready, setActive]);

  return (
    <>
      <div
        aria-hidden
        className={`page-transition-overlay ${
          isTransitioning ? "page-transition-overlay-active" : ""
        }`}
      />
      <div
        className={`relative flex min-h-screen flex-col bg-black page-fade-in transition-opacity duration-300 ease-out ${
          isTransitioning ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(88,28,135,0.16),transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.65),transparent_60%)]" />
        <div className="relative mx-auto flex h-screen w-full max-w-5xl flex-col px-4 sm:px-8">
          {pool.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-sm text-zinc-400">
              <p className="max-w-md leading-relaxed">
                No storm whispers yet. Seed
                <code className="mx-2 rounded bg-zinc-900 px-2 py-1 text-[0.75rem] text-zinc-200">
                  content/posts/storm/storm.md
                </code>
                to conjure the flow.
              </p>
            </div>
          ) : (
            <div
              ref={containerRef}
              onScroll={handleScroll}
              className="storm-scroll-container relative flex-1 overflow-y-auto py-24"
              tabIndex={isInteractive ? 0 : -1}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black via-black/60 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/60 to-transparent" />
              <div className="relative flex flex-col items-center gap-16">
                {items.map((item) => (
                  <StormQuoteCard
                    key={item.id}
                    item={item}
                    onReenter={() => rerollItem(item.id)}
                    registerElement={registerItemElement}
                    isActive={item.id === activeId && !isUserScrolling}
                    isDepthDimmed={depthEnabled && item.id !== activeId}
                  />
                ))}
              </div>
              {loading && (
                <div className="pb-12 text-center text-xs font-semibold uppercase tracking-[0.45em] text-zinc-600">
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
  registerElement: (id: number, node: HTMLDivElement | null) => void;
  isActive: boolean;
  isDepthDimmed: boolean;
};

function StormQuoteCard({
  item,
  onReenter,
  registerElement,
  isActive,
  isDepthDimmed,
}: StormQuoteCardProps) {
  const { text } = item;
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const seenRef = useRef(false);
  const visibleRef = useRef(false);
  const handleRef = useCallback((element: HTMLDivElement | null) => {
    setNode(element);
  }, []);

  useEffect(() => {
    registerElement(item.id, node);
    return () => {
      registerElement(item.id, null);
    };
  }, [item.id, node, registerElement]);

  useEffect(() => {
    const currentNode = node;
    if (!currentNode) {
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

    observer.observe(currentNode);

    return () => {
      observer.disconnect();
    };
  }, [node, onReenter]);

  const textStyles = useMemo(() => {
    const base =
      "max-w-3xl text-center text-3xl font-semibold leading-relaxed text-zinc-100 whitespace-pre-line sm:text-4xl transition-all duration-500";
    if (isActive) {
      return `${base} text-violet-200 drop-shadow-[0_0_25px_rgba(168,85,247,0.45)]`;
    }
    if (isDepthDimmed) {
      return `${base} text-zinc-500/70 blur-[0.5px] scale-[0.97]`;
    }
    return base;
  }, [isActive, isDepthDimmed]);

  return (
    <article ref={handleRef} className="flex justify-center px-6 py-6">
      <p className={textStyles}>{text}</p>
    </article>
  );
}
