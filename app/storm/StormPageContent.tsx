"use client";

import React from "react";
import Link from "next/link";

import { usePageTransition } from "@/hooks/usePageTransition";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

import styles from "./storm.module.css";

type StormPageContentProps = {
  quotes: string[];
};

const IDLE_DELAY_MS = 120;
const POINTER_MOVE_DEADZONE_MS = 100;
const POINTER_MOVE_RESET_GAP_MS = 160;
const OVERSCAN_ROWS = 3;

const BLUR_FOCUSED_CLASS = "text-violet-300 blur-0 opacity-100 scale-100";
const BLUR_ACTIVE_CLASS = "text-zinc-100 blur-0 opacity-100 scale-100";
const BLUR_IDLE_CLASS = "text-zinc-500 blur-sm opacity-60 scale-95";

const QUOTE_CARD_BASE_CLASS =
  "flex min-h-[34vh] items-center justify-center py-6 will-change-transform";
const QUOTE_TEXT_CLASS =
  "max-w-3xl text-center text-2xl font-semibold leading-tight transition-all duration-500 ease-out sm:text-3xl";

type PointerMoveState = {
  startTime: number;
  lastTime: number;
  triggered: boolean;
};

type RenderWindow = {
  start: number;
  end: number;
};

function positiveModulo(value: number, count: number) {
  if (count === 0) {
    return 0;
  }
  const result = value % count;
  return result < 0 ? result + count : result;
}

export function StormPageContent({ quotes }: StormPageContentProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const measureRef = React.useRef<HTMLLIElement | null>(null);
  const rowHeightRef = React.useRef(0);
  const scrollFrameRef = React.useRef<number | null>(null);
  const idleTimeoutRef = React.useRef<number | null>(null);
  const focusUpdateRef = React.useRef<number | null>(null);
  const pointerMoveStateRef = React.useRef<PointerMoveState>({
    startTime: 0,
    lastTime: 0,
    triggered: false,
  });
  const initialFocusRef = React.useRef(0);
  const pendingFocusRef = React.useRef<number | null>(null);
  const hasAlignedInitialFocusRef = React.useRef(false);
  const isIdleRef = React.useRef(!prefersReducedMotion);

  const [rowHeight, setRowHeight] = React.useState(0);
  const [renderWindow, setRenderWindow] = React.useState<RenderWindow>({ start: 0, end: 0 });
  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const [isIdle, setIsIdle] = React.useState(() => !prefersReducedMotion);

  const quoteCount = quotes.length;

  const { isTransitioning, handleLinkClick } = usePageTransition("storm");
  const isInteractive = !isTransitioning;

  const updateRowHeight = React.useCallback(() => {
    const node = measureRef.current;
    if (!node) {
      return;
    }
    const height = node.getBoundingClientRect().height;
    if (!Number.isFinite(height) || height <= 0) {
      return;
    }
    const rounded = Math.max(1, Math.round(height * 1000) / 1000);
    if (Math.abs(rounded - rowHeightRef.current) > 0.5) {
      rowHeightRef.current = rounded;
      setRowHeight(rounded);
    } else if (rowHeightRef.current === 0) {
      rowHeightRef.current = rounded;
      setRowHeight(rounded);
    }
  }, []);

  React.useEffect(() => {
    const observer = new ResizeObserver(() => {
      updateRowHeight();
    });
    const node = measureRef.current;
    if (node) {
      observer.observe(node);
    }
    return () => {
      observer.disconnect();
    };
  }, [updateRowHeight]);

  const clearIdleTimeout = React.useCallback(() => {
    if (idleTimeoutRef.current !== null) {
      window.clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
  }, []);

  const scheduleFocusUpdate = React.useCallback(() => {
    if (focusUpdateRef.current !== null) {
      return;
    }
    focusUpdateRef.current = window.requestAnimationFrame(() => {
      focusUpdateRef.current = null;
      const container = containerRef.current;
      const height = rowHeightRef.current;
      if (!container || quoteCount === 0 || height <= 0) {
        return;
      }
      const segmentHeight = height * quoteCount;
      const bandStart = segmentHeight;
      const normalized = container.scrollTop - bandStart;
      const viewCenter = normalized + container.clientHeight / 2;
      const approx = viewCenter / height - 0.5;
      let nextIndex = Math.round(approx);
      nextIndex = positiveModulo(nextIndex, quoteCount);
      pendingFocusRef.current = nextIndex;
      if (isIdleRef.current) {
        setFocusedIndex((current) => (current === nextIndex ? current : nextIndex));
      }
    });
  }, [quoteCount]);

  const updateRenderWindow = React.useCallback(() => {
    const container = containerRef.current;
    const height = rowHeightRef.current;
    if (!container || quoteCount === 0 || height <= 0) {
      return;
    }
    const segmentHeight = height * quoteCount;
    const bandStart = segmentHeight;
    const bandEnd = segmentHeight * 2;
    let scrollTop = container.scrollTop;
    if (scrollTop < bandStart) {
      scrollTop += segmentHeight;
      container.scrollTop = scrollTop;
    } else if (scrollTop >= bandEnd) {
      scrollTop -= segmentHeight;
      container.scrollTop = scrollTop;
    }
    const normalized = container.scrollTop - bandStart;
    const visibleRows = Math.max(1, Math.ceil(container.clientHeight / height));
    const start = Math.floor(normalized / height) - OVERSCAN_ROWS;
    const end = start + visibleRows + OVERSCAN_ROWS * 2;
    setRenderWindow((previous) => {
      if (previous.start === start && previous.end === end) {
        return previous;
      }
      return { start, end };
    });
  }, [quoteCount]);

  const resetIdle = React.useCallback(() => {
    if (prefersReducedMotion) {
      setIsIdle(false);
      isIdleRef.current = false;
      return;
    }
    setIsIdle(false);
    isIdleRef.current = false;
    clearIdleTimeout();
    idleTimeoutRef.current = window.setTimeout(() => {
      scheduleFocusUpdate();
      isIdleRef.current = true;
      setIsIdle(true);
    }, IDLE_DELAY_MS);
  }, [clearIdleTimeout, prefersReducedMotion, scheduleFocusUpdate]);

  React.useEffect(() => {
    if (quoteCount === 0) {
      initialFocusRef.current = 0;
      setFocusedIndex(0);
      hasAlignedInitialFocusRef.current = true;
      return;
    }
    const next = Math.floor(Math.random() * quoteCount);
    initialFocusRef.current = next;
    pendingFocusRef.current = next;
    setFocusedIndex(next);
    hasAlignedInitialFocusRef.current = false;
  }, [quoteCount]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const handleResize = () => {
      updateRenderWindow();
      scheduleFocusUpdate();
    };
    const observer = new ResizeObserver(handleResize);
    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, [scheduleFocusUpdate, updateRenderWindow]);

  React.useEffect(() => {
    if (rowHeight > 0 && quoteCount > 0) {
      updateRenderWindow();
      scheduleFocusUpdate();
    }
  }, [quoteCount, rowHeight, scheduleFocusUpdate, updateRenderWindow]);

  React.useEffect(() => {
    if (prefersReducedMotion) {
      setIsIdle(false);
      isIdleRef.current = false;
      clearIdleTimeout();
      return;
    }
    if (idleTimeoutRef.current === null) {
      idleTimeoutRef.current = window.setTimeout(() => {
        scheduleFocusUpdate();
        isIdleRef.current = true;
        setIsIdle(true);
      }, IDLE_DELAY_MS);
    }
    return () => {
      clearIdleTimeout();
    };
  }, [clearIdleTimeout, prefersReducedMotion, scheduleFocusUpdate]);

  React.useEffect(() => {
    return () => {
      clearIdleTimeout();
      if (focusUpdateRef.current !== null) {
        window.cancelAnimationFrame(focusUpdateRef.current);
        focusUpdateRef.current = null;
      }
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
  }, [clearIdleTimeout]);

  React.useEffect(() => {
    isIdleRef.current = isIdle;
    if (isIdle) {
      const next = pendingFocusRef.current;
      if (typeof next === "number") {
        setFocusedIndex((current) => (current === next ? current : next));
      }
    }
  }, [isIdle]);

  React.useEffect(() => {
    if (quoteCount === 0) {
      return;
    }
    const container = containerRef.current;
    const height = rowHeightRef.current;
    if (!container || height <= 0) {
      return;
    }
    if (hasAlignedInitialFocusRef.current) {
      return;
    }
    const segmentHeight = height * quoteCount;
    const bandStart = segmentHeight;
    const bandEnd = segmentHeight * 2;
    const targetIndex = positiveModulo(initialFocusRef.current, quoteCount);
    const targetCenter = bandStart + targetIndex * height + height / 2;
    let desiredScrollTop = targetCenter - container.clientHeight / 2;
    const minScroll = bandStart;
    const maxScroll = bandStart + segmentHeight - container.clientHeight;
    if (maxScroll <= minScroll) {
      desiredScrollTop = bandStart;
    } else if (desiredScrollTop < minScroll) {
      desiredScrollTop = minScroll;
    } else if (desiredScrollTop > maxScroll) {
      desiredScrollTop = maxScroll;
    }
    if (desiredScrollTop < bandStart) {
      desiredScrollTop = bandStart;
    } else if (desiredScrollTop >= bandEnd) {
      desiredScrollTop = bandEnd - 1;
    }
    container.scrollTop = desiredScrollTop;
    hasAlignedInitialFocusRef.current = true;
    pendingFocusRef.current = targetIndex;
    setFocusedIndex(targetIndex);
    updateRenderWindow();
    scheduleFocusUpdate();
  }, [quoteCount, rowHeight, scheduleFocusUpdate, updateRenderWindow]);

  React.useEffect(() => {
    updateRowHeight();
  }, [quotes, updateRowHeight]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!prefersReducedMotion) {
      resetIdle();
    }
    if (quoteCount === 0) {
      return;
    }
    const container = event.currentTarget;
    const height = rowHeightRef.current;
    if (height <= 0) {
      return;
    }
    const segmentHeight = height * quoteCount;
    const bandStart = segmentHeight;
    const bandEnd = segmentHeight * 2;
    if (container.scrollTop < bandStart) {
      container.scrollTop += segmentHeight;
    } else if (container.scrollTop >= bandEnd) {
      container.scrollTop -= segmentHeight;
    }
    if (scrollFrameRef.current === null) {
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        updateRenderWindow();
        scheduleFocusUpdate();
      });
    }
  };

  const handleImmediateInteraction = React.useCallback(() => {
    if (prefersReducedMotion) {
      resetIdle();
      return;
    }
    const state = pointerMoveStateRef.current;
    state.startTime = 0;
    state.lastTime = 0;
    state.triggered = false;
    resetIdle();
  }, [prefersReducedMotion, resetIdle]);

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (prefersReducedMotion) {
        resetIdle();
        return;
      }
      if (event.pointerType && event.pointerType !== "mouse") {
        handleImmediateInteraction();
        return;
      }
      const now = performance.now();
      const state = pointerMoveStateRef.current;
      if (state.lastTime === 0 || now - state.lastTime > POINTER_MOVE_RESET_GAP_MS) {
        state.startTime = now;
        state.triggered = false;
      }
      state.lastTime = now;
      if (!state.triggered && now - state.startTime >= POINTER_MOVE_DEADZONE_MS) {
        state.triggered = true;
        resetIdle();
      }
    },
    [handleImmediateInteraction, prefersReducedMotion, resetIdle],
  );

  const getCardState = React.useCallback(
    (index: number) => {
      if (!isIdle) {
        return "active";
      }
      if (index === focusedIndex) {
        return "focused";
      }
      return "idle";
    },
    [focusedIndex, isIdle],
  );

  const renderItems = React.useMemo(() => {
    const height = rowHeightRef.current;
    if (quoteCount === 0 || height <= 0) {
      return [] as Array<{ key: string; quote: string; top: number; index: number }>;
    }
    const segmentHeight = height * quoteCount;
    const items: Array<{ key: string; quote: string; top: number; index: number }> = [];
    const start = renderWindow.start;
    const end = renderWindow.end;
    if (end <= start) {
      return items;
    }
    for (let virtualIndex = start; virtualIndex < end; virtualIndex += 1) {
      const loop = Math.floor(virtualIndex / quoteCount);
      let top = segmentHeight + virtualIndex * height - loop * segmentHeight;
      while (top < segmentHeight) {
        top += segmentHeight;
      }
      while (top >= segmentHeight * 2) {
        top -= segmentHeight;
      }
      const baseIndex = positiveModulo(virtualIndex, quoteCount);
      items.push({
        key: `${baseIndex}-${loop}`,
        quote: quotes[baseIndex],
        top,
        index: baseIndex,
      });
    }
    items.sort((a, b) => a.top - b.top);
    return items;
  }, [quoteCount, quotes, renderWindow.end, renderWindow.start]);

  const innerHeight: number | string =
    rowHeight > 0 && quoteCount > 0 ? rowHeight * quoteCount * 3 : "100%";

  return (
    <>
      <div className={`page-transition-overlay ${isTransitioning ? "page-transition-overlay-active" : ""}`} />
      <div
        className={`relative min-h-screen bg-black page-fade-in transition-opacity duration-300 ease-out ${
          isTransitioning ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 pb-12 pt-10 sm:px-10 sm:pt-16">
          <div className="flex justify-end pb-10">
            <Link
              href="/?view=blog"
              onClick={(event) => handleLinkClick(event, "/?view=blog")}
              className="inline-flex w-fit items-center gap-2 text-sm font-semibold uppercase tracking-[0.35em] text-zinc-600 transition-colors duration-200 hover:text-violet-200"
              tabIndex={isInteractive ? undefined : -1}
            >
              <span aria-hidden>←</span> Drift back
            </Link>
          </div>
          <div
            ref={containerRef}
            className={`relative flex-1 overflow-y-auto pb-20 pt-6 ${styles.scrollArea}`}
            onScroll={handleScroll}
            onWheel={handleImmediateInteraction}
            onPointerDown={handleImmediateInteraction}
            onPointerMove={handlePointerMove}
            onTouchStart={handleImmediateInteraction}
            onFocus={handleImmediateInteraction}
            onKeyDown={handleImmediateInteraction}
            aria-label="Storm quotes"
            tabIndex={isInteractive ? 0 : -1}
          >
            <ul
              role="list"
              className="relative h-full w-full"
              style={{ height: innerHeight, position: "relative", listStyle: "none", margin: 0, padding: 0 }}
            >
              {renderItems.map((item) => {
                const state = getCardState(item.index);
                const stateClasses =
                  state === "focused"
                    ? BLUR_FOCUSED_CLASS
                    : state === "active"
                      ? BLUR_ACTIVE_CLASS
                      : BLUR_IDLE_CLASS;
                return (
                  <li
                    key={item.key}
                    className={QUOTE_CARD_BASE_CLASS}
                    style={{ position: "absolute", top: item.top, left: 0, right: 0 }}
                  >
                    <blockquote className={`${QUOTE_TEXT_CLASS} ${stateClasses}`}>{item.quote}</blockquote>
                  </li>
                );
              })}
              <li
                ref={measureRef}
                aria-hidden
                className={`${QUOTE_CARD_BASE_CLASS} pointer-events-none opacity-0`}
                style={{ position: "absolute", left: 0, right: 0, top: 0 }}
              >
                <blockquote className={QUOTE_TEXT_CLASS}>{quotes[0] ?? ""}</blockquote>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

