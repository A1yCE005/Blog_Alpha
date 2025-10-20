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
const VISIBLE_ROWS = 5;
const OVERSCAN_ROWS = 4;
const DEFAULT_ROW_HEIGHT = 240;

type PointerMoveState = {
  startTime: number;
  lastTime: number;
  triggered: boolean;
};

type LayoutState = {
  containerHeight: number;
  rowHeight: number;
};

type VirtualItem = {
  virtualIndex: number;
  baseIndex: number;
  top: number;
};

function modulo(value: number, length: number) {
  if (length <= 0) {
    return 0;
  }
  const result = value % length;
  return result < 0 ? result + length : result;
}

export function StormPageContent({ quotes }: StormPageContentProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const idleTimeoutRef = React.useRef<number | null>(null);
  const focusUpdateRef = React.useRef<number | null>(null);
  const rowHeightRef = React.useRef(0);
  const segmentHeightRef = React.useRef(0);

  const [layout, setLayout] = React.useState<LayoutState>(() => {
    if (typeof window !== "undefined") {
      const initialHeight = window.innerHeight || DEFAULT_ROW_HEIGHT * VISIBLE_ROWS;
      const initialRowHeight = initialHeight > 0 ? initialHeight / VISIBLE_ROWS : DEFAULT_ROW_HEIGHT;
      rowHeightRef.current = initialRowHeight;
      segmentHeightRef.current = initialRowHeight * quotes.length;
      return {
        containerHeight: initialHeight,
        rowHeight: initialRowHeight,
      };
    }
    rowHeightRef.current = DEFAULT_ROW_HEIGHT;
    segmentHeightRef.current = DEFAULT_ROW_HEIGHT * quotes.length;
    return {
      containerHeight: DEFAULT_ROW_HEIGHT * VISIBLE_ROWS,
      rowHeight: DEFAULT_ROW_HEIGHT,
    };
  });
  const [scrollTop, setScrollTop] = React.useState(0);
  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const [isIdle, setIsIdle] = React.useState(() => !prefersReducedMotion);
  const initialFocusRef = React.useRef(0);
  const hasAlignedInitialFocusRef = React.useRef(false);
  const pendingFocusRef = React.useRef<number | null>(null);
  const isIdleRef = React.useRef(!prefersReducedMotion);
  const pointerMoveStateRef = React.useRef<PointerMoveState>({
    startTime: 0,
    lastTime: 0,
    triggered: false,
  });

  const clearIdleTimeout = React.useCallback(() => {
    if (idleTimeoutRef.current) {
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
      const rowHeight = rowHeightRef.current;
      const containerHeight = layout.containerHeight || container?.clientHeight || 0;

      if (!container || rowHeight <= 0 || containerHeight <= 0 || quotes.length === 0) {
        return;
      }

      const center = container.scrollTop + containerHeight / 2;
      const virtualIndex = Math.round(center / rowHeight - 0.5);
      const nearestIndex = modulo(virtualIndex, quotes.length);

      pendingFocusRef.current = nearestIndex;
      if (isIdleRef.current) {
        setFocusedIndex((current) => (current === nearestIndex ? current : nearestIndex));
      }
    });
  }, [layout.containerHeight, quotes.length]);

  const resetIdle = React.useCallback(() => {
    if (prefersReducedMotion) {
      setIsIdle(false);
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

  const { isTransitioning, handleLinkClick } = usePageTransition("storm");
  const isInteractive = !isTransitioning;

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateLayout = () => {
      const measuredHeight = container.clientHeight;
      const nextRowHeight = measuredHeight > 0 ? measuredHeight / VISIBLE_ROWS : rowHeightRef.current;
      rowHeightRef.current = nextRowHeight;
      segmentHeightRef.current = nextRowHeight * quotes.length;
      setLayout((current) => {
        if (current.containerHeight === measuredHeight && current.rowHeight === nextRowHeight) {
          return current;
        }
        return {
          containerHeight: measuredHeight,
          rowHeight: nextRowHeight,
        };
      });
      setScrollTop(container.scrollTop);
    };

    updateLayout();
    const resizeObserver = new ResizeObserver(updateLayout);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [quotes.length]);

  React.useEffect(() => {
    scheduleFocusUpdate();
  }, [layout.containerHeight, layout.rowHeight, quotes.length, scheduleFocusUpdate]);

  React.useEffect(() => {
    if (quotes.length === 0) {
      initialFocusRef.current = 0;
      setFocusedIndex(0);
      hasAlignedInitialFocusRef.current = true;
      return;
    }

    const nextIndex = Math.floor(Math.random() * quotes.length);
    initialFocusRef.current = nextIndex;
    pendingFocusRef.current = nextIndex;
    setFocusedIndex(nextIndex);
    hasAlignedInitialFocusRef.current = false;
  }, [quotes.length]);

  React.useEffect(() => {
    const container = containerRef.current;
    const rowHeight = rowHeightRef.current;
    if (!container || quotes.length === 0 || rowHeight <= 0 || layout.containerHeight <= 0) {
      return;
    }

    const segmentHeight = rowHeight * quotes.length;
    segmentHeightRef.current = segmentHeight;

    if (hasAlignedInitialFocusRef.current) {
      return;
    }

    const preferredBaseIndex = initialFocusRef.current;
    const targetVirtualIndex = quotes.length + preferredBaseIndex;
    const targetTop = targetVirtualIndex * rowHeight;
    const centerOffset = layout.containerHeight / 2 - rowHeight / 2;
    const nextScrollTop = targetTop - centerOffset;

    container.scrollTop = nextScrollTop;
    setScrollTop(nextScrollTop);
    hasAlignedInitialFocusRef.current = true;
    setFocusedIndex(preferredBaseIndex);
    pendingFocusRef.current = preferredBaseIndex;
    scheduleFocusUpdate();
  }, [layout.containerHeight, quotes.length, scheduleFocusUpdate]);

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

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!prefersReducedMotion) {
      resetIdle();
    }

    const container = event.currentTarget;
    const segmentHeight = segmentHeightRef.current;

    if (segmentHeight > 0) {
      const lowerBound = segmentHeight;
      const upperBound = segmentHeight * 2;
      if (container.scrollTop < lowerBound) {
        container.scrollTop += segmentHeight;
      } else if (container.scrollTop >= upperBound) {
        container.scrollTop -= segmentHeight;
      }
    }

    setScrollTop(container.scrollTop);
    scheduleFocusUpdate();
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

  const virtualItems = React.useMemo<VirtualItem[]>(() => {
    if (quotes.length === 0) {
      return [];
    }

    const rowHeight = layout.rowHeight > 0 ? layout.rowHeight : rowHeightRef.current;
    const containerHeight = layout.containerHeight > 0
      ? layout.containerHeight
      : typeof window !== "undefined"
        ? window.innerHeight
        : DEFAULT_ROW_HEIGHT * VISIBLE_ROWS;

    if (rowHeight <= 0) {
      return quotes.map((_, index) => ({
        virtualIndex: index,
        baseIndex: index,
        top: index * DEFAULT_ROW_HEIGHT,
      }));
    }

    const segmentHeight = rowHeight * quotes.length;
    segmentHeightRef.current = segmentHeight;
    const totalVirtualRows = quotes.length * 3;
    const effectiveContainerHeight = Math.max(containerHeight, rowHeight);
    const visibleRows = Math.max(VISIBLE_ROWS, Math.ceil(effectiveContainerHeight / rowHeight));
    const startVirtualIndex = Math.floor(scrollTop / rowHeight) - OVERSCAN_ROWS;
    const totalToRender = visibleRows + OVERSCAN_ROWS * 2;
    const items: VirtualItem[] = [];

    for (let i = 0; i < totalToRender; i += 1) {
      const virtualIndex = startVirtualIndex + i;
      const normalizedVirtualIndex = modulo(virtualIndex, totalVirtualRows);
      const baseIndex = modulo(virtualIndex, quotes.length);
      const top = normalizedVirtualIndex * rowHeight;
      items.push({
        virtualIndex,
        baseIndex,
        top,
      });
    }

    return items;
  }, [layout.containerHeight, layout.rowHeight, quotes, scrollTop]);

  const rowHeightForRendering = layout.rowHeight || rowHeightRef.current || DEFAULT_ROW_HEIGHT;
  const segmentHeightForRendering =
    segmentHeightRef.current > 0
      ? segmentHeightRef.current
      : rowHeightForRendering * quotes.length;
  const totalVirtualHeight =
    segmentHeightForRendering > 0
      ? segmentHeightForRendering * 3
      : rowHeightForRendering * Math.max(quotes.length, 1) * 3;

  const getCardState = (baseIndex: number) => {
    if (!isIdle) {
      return "active";
    }
    if (baseIndex === focusedIndex) {
      return "focused";
    }
    return "idle";
  };

  const renderQuote = (quote: string, item: VirtualItem) => {
    const { baseIndex, virtualIndex, top } = item;
    const state = getCardState(baseIndex);

    const stateClasses =
      state === "focused"
        ? "text-violet-300 blur-0 opacity-100 scale-100"
        : state === "active"
          ? "text-zinc-100 blur-0 opacity-100 scale-100"
          : "text-zinc-500 blur-sm opacity-60 scale-95";

    return (
      <li
        key={`${baseIndex}-${virtualIndex}`}
        data-base-index={baseIndex}
        className="absolute inset-x-0 flex items-center justify-center py-2 will-change-transform"
        style={{ top, height: `${rowHeightForRendering}px` }}
      >
        <blockquote
          className={`max-w-3xl text-center text-2xl font-semibold leading-tight transition-all duration-500 ease-out sm:text-3xl ${stateClasses}`}
        >
          {quote}
        </blockquote>
      </li>
    );
  };

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
              className="relative m-0 list-none p-0"
              style={{ height: `${totalVirtualHeight}px` }}
            >
              {virtualItems.map((item) => renderQuote(quotes[item.baseIndex], item))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

