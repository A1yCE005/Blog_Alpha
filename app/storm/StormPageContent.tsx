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
const OVERSCAN_ROWS = 2;

type PointerMoveState = {
  startTime: number;
  lastTime: number;
  triggered: boolean;
};

const clamp = (value: number, min: number, max: number) => {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
};

const modulo = (value: number, divisor: number) => {
  if (divisor === 0) {
    return 0;
  }
  const remainder = value % divisor;
  return remainder < 0 ? remainder + divisor : remainder;
};

export function StormPageContent({ quotes }: StormPageContentProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const measurementRef = React.useRef<HTMLLIElement | null>(null);
  const idleTimeoutRef = React.useRef<number | null>(null);
  const focusUpdateRef = React.useRef<number | null>(null);
  const containerHeightRef = React.useRef(0);
  const rowHeightRef = React.useRef(0);
  const segmentHeightRef = React.useRef(0);

  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const [isIdle, setIsIdle] = React.useState(() => !prefersReducedMotion);
  const [rowHeight, setRowHeight] = React.useState(0);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [visibleRowEstimate, setVisibleRowEstimate] = React.useState(1);

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
      if (!container) {
        return;
      }

      const items = container.querySelectorAll<HTMLLIElement>("[data-base-index]");
      if (items.length === 0) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      items.forEach((item) => {
        const itemRect = item.getBoundingClientRect();
        const itemMidY = itemRect.top + itemRect.height / 2;
        const distance = Math.abs(itemMidY - midY);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = Number.parseInt(item.dataset.baseIndex ?? "0", 10);
        }
      });

      pendingFocusRef.current = nearestIndex;
      if (isIdleRef.current) {
        setFocusedIndex((current) => (current === nearestIndex ? current : nearestIndex));
      }
    });
  }, []);

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
    if (quotes.length === 0) {
      initialFocusRef.current = 0;
      setFocusedIndex(0);
      pendingFocusRef.current = 0;
      hasAlignedInitialFocusRef.current = true;
      return;
    }

    const nextIndex = Math.floor(Math.random() * quotes.length);
    initialFocusRef.current = nextIndex;
    pendingFocusRef.current = nextIndex;
    setFocusedIndex(nextIndex);
    hasAlignedInitialFocusRef.current = false;
  }, [quotes.length]);

  const updateMeasurements = React.useCallback(() => {
    const container = containerRef.current;
    const measure = measurementRef.current;
    if (!container || !measure) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    if (containerRect.height > 0) {
      containerHeightRef.current = containerRect.height;
      if (rowHeightRef.current > 0) {
        setVisibleRowEstimate(Math.max(1, Math.round(containerRect.height / rowHeightRef.current)));
      }
    }

    const measureRect = measure.getBoundingClientRect();
    if (measureRect.height > 0) {
      rowHeightRef.current = measureRect.height;
      setRowHeight(measureRect.height);
      if (quotes.length > 0) {
        segmentHeightRef.current = measureRect.height * quotes.length;
      }
    }
  }, [quotes.length]);

  React.useEffect(() => {
    const container = containerRef.current;
    const measure = measurementRef.current;
    if (!container || !measure) {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateMeasurements();
      hasAlignedInitialFocusRef.current = false;
    });
    observer.observe(container);
    observer.observe(measure);

    updateMeasurements();

    return () => {
      observer.disconnect();
    };
  }, [updateMeasurements]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || quotes.length === 0 || rowHeight <= 0) {
      return;
    }

    const segment = rowHeight * quotes.length;
    segmentHeightRef.current = segment;
    if (!hasAlignedInitialFocusRef.current) {
      const preferredBaseIndex = clamp(initialFocusRef.current, 0, quotes.length - 1);
      const target = segment + preferredBaseIndex * rowHeight;
      container.scrollTop = target;
      setScrollTop(target);
      setFocusedIndex(preferredBaseIndex);
      pendingFocusRef.current = preferredBaseIndex;
      hasAlignedInitialFocusRef.current = true;
      scheduleFocusUpdate();
      return;
    }

    setScrollTop(container.scrollTop);
  }, [quotes.length, rowHeight, scheduleFocusUpdate]);

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
    const segment = segmentHeightRef.current;

    if (segment > 0) {
      if (container.scrollTop < segment) {
        container.scrollTop += segment;
      } else if (container.scrollTop >= segment * 2) {
        container.scrollTop -= segment;
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

  const getCardState = React.useCallback(
    (baseIndex: number) => {
      if (!isIdle) {
        return "active";
      }
      if (baseIndex === focusedIndex) {
        return "focused";
      }
      return "idle";
    },
    [focusedIndex, isIdle],
  );

  const segment = React.useMemo(() => {
    if (quotes.length === 0 || rowHeight <= 0) {
      return 0;
    }
    return rowHeight * quotes.length;
  }, [quotes.length, rowHeight]);

  const rowsToRender = React.useMemo(() => {
    if (quotes.length === 0) {
      return [];
    }

    if (rowHeight <= 0 || segment <= 0) {
      return quotes.map((quote, index) => {
        const state = getCardState(index);
        const stateClasses =
          state === "focused"
            ? "text-violet-300 blur-0 opacity-100 scale-100"
            : state === "active"
              ? "text-zinc-100 blur-0 opacity-100 scale-100"
              : "text-zinc-500 blur-sm opacity-60 scale-95";

        return (
          <li
            key={`${index}-fallback`}
            data-base-index={index}
            className="flex min-h-[26vh] items-center justify-center py-4"
          >
            <blockquote
              className={`max-w-3xl text-center text-2xl font-semibold leading-tight transition-all duration-500 ease-out sm:text-3xl ${stateClasses}`}
            >
              {quote}
            </blockquote>
          </li>
        );
      });
    }

    const containerHeight = containerHeightRef.current;
    const viewportRows = Math.ceil(containerHeight / rowHeight);
    const baseCount = Math.max(1, visibleRowEstimate, viewportRows);
    const visibleCount = baseCount + OVERSCAN_ROWS * 2;

    const bandScrollTop = scrollTop - segment;
    const baseVirtualIndex = Math.floor(bandScrollTop / rowHeight);
    const startVirtualIndex = baseVirtualIndex - OVERSCAN_ROWS;
    const endVirtualIndex = startVirtualIndex + visibleCount;
    const rendered: React.ReactNode[] = [];

    for (let virtualIndex = startVirtualIndex; virtualIndex < endVirtualIndex; virtualIndex += 1) {
      const baseIndex = modulo(virtualIndex, quotes.length);
      let offsetTop = segment + virtualIndex * rowHeight;
      if (segment > 0) {
        while (offsetTop < segment) {
          offsetTop += segment;
        }
        while (offsetTop >= segment * 2) {
          offsetTop -= segment;
        }
      }

      const state = getCardState(baseIndex);
      const stateClasses =
        state === "focused"
          ? "text-violet-300 blur-0 opacity-100 scale-100"
          : state === "active"
            ? "text-zinc-100 blur-0 opacity-100 scale-100"
            : "text-zinc-500 blur-sm opacity-60 scale-95";

      rendered.push(
        <li
          key={`${baseIndex}-${virtualIndex}`}
          data-base-index={baseIndex}
          data-virtual-index={virtualIndex}
          className="absolute left-0 right-0 flex min-h-[26vh] items-center justify-center py-4 will-change-transform"
          style={{ transform: `translateY(${offsetTop}px)` }}
        >
          <blockquote
            className={`max-w-3xl text-center text-2xl font-semibold leading-tight transition-all duration-500 ease-out sm:text-3xl ${stateClasses}`}
          >
            {quotes[baseIndex]}
          </blockquote>
        </li>,
      );
    }

    return rendered;
  }, [getCardState, quotes, rowHeight, scrollTop, segment, visibleRowEstimate]);

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
              className="relative"
              style={{ height: segment > 0 ? segment * 3 : quotes.length * 240 }}
            >
              {rowsToRender}
            </ul>
            <ul
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 w-full opacity-0"
            >
              <li ref={measurementRef} className="flex min-h-[26vh] items-center justify-center py-4">
                <blockquote className="max-w-3xl text-center text-2xl font-semibold leading-tight sm:text-3xl">
                  {quotes[0] ?? ""}
                </blockquote>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
