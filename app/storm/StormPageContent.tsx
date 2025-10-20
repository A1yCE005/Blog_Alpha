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

type PointerMoveState = {
  startTime: number;
  lastTime: number;
  triggered: boolean;
};

export function StormPageContent({ quotes }: StormPageContentProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const repeatedQuotes = React.useMemo(() => {
    if (quotes.length === 0) {
      return quotes;
    }
    return [...quotes, ...quotes, ...quotes];
  }, [quotes]);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const baseHeightRef = React.useRef(0);
  const idleTimeoutRef = React.useRef<number | null>(null);
  const focusUpdateRef = React.useRef<number | null>(null);

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
    const container = containerRef.current;
    if (!container || quotes.length === 0) {
      return;
    }

    const updateBaseHeight = () => {
      const totalHeight = container.scrollHeight;
      if (totalHeight <= 0) {
        return;
      }

      const newBase = totalHeight / 3;
      if (!Number.isFinite(newBase) || newBase <= 0) {
        return;
      }

      const previousBase = baseHeightRef.current;
      baseHeightRef.current = newBase;

      const relativeOffset = previousBase > 0 ? container.scrollTop - previousBase : 0;
      const clampedOffset = Math.max(0, Math.min(relativeOffset, newBase));
      container.scrollTop = newBase + clampedOffset;
      scheduleFocusUpdate();
    };

    const raf = window.requestAnimationFrame(updateBaseHeight);
    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(updateBaseHeight);
    });
    resizeObserver.observe(container);

    return () => {
      window.cancelAnimationFrame(raf);
      resizeObserver.disconnect();
    };
  }, [quotes.length, scheduleFocusUpdate]);

  React.useEffect(() => {
    scheduleFocusUpdate();
  }, [repeatedQuotes, scheduleFocusUpdate]);

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
    if (quotes.length === 0) {
      return;
    }

    let frame: number | null = null;

    const alignToInitialQuote = () => {
      const container = containerRef.current;
      if (!container) {
        frame = window.requestAnimationFrame(alignToInitialQuote);
        return;
      }

      if (hasAlignedInitialFocusRef.current) {
        return;
      }

      const items = Array.from(
        container.querySelectorAll<HTMLLIElement>("[data-base-index][data-loop-index]"),
      );

      if (items.length === 0) {
        frame = window.requestAnimationFrame(alignToInitialQuote);
        return;
      }

      const preferredBaseIndex = initialFocusRef.current;
      const target = items.find((item) => {
        if (item.dataset.loopIndex !== "1") {
          return false;
        }

        const parsedIndex = Number.parseInt(item.dataset.baseIndex ?? "0", 10);
        return parsedIndex === preferredBaseIndex;
      });

      if (!target) {
        frame = window.requestAnimationFrame(alignToInitialQuote);
        return;
      }

      const containerHeight = container.clientHeight;
      const scrollTarget = target.offsetTop - containerHeight / 2 + target.clientHeight / 2;
      const maxScroll = Math.max(0, container.scrollHeight - containerHeight);
      const nextScrollTop = Math.max(0, Math.min(scrollTarget, maxScroll));

      container.scrollTop = nextScrollTop;
      hasAlignedInitialFocusRef.current = true;
      setFocusedIndex(preferredBaseIndex);
      pendingFocusRef.current = preferredBaseIndex;
      scheduleFocusUpdate();
    };

    frame = window.requestAnimationFrame(alignToInitialQuote);

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [quotes.length, scheduleFocusUpdate]);

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
    const baseHeight = baseHeightRef.current;

    if (baseHeight > 0) {
      if (container.scrollTop < baseHeight * 0.5) {
        container.scrollTop += baseHeight;
      } else if (container.scrollTop > baseHeight * 1.5) {
        container.scrollTop -= baseHeight;
      }
    }

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

  const getCardState = (baseIndex: number) => {
    if (!isIdle) {
      return "active";
    }
    if (baseIndex === focusedIndex) {
      return "focused";
    }
    return "idle";
  };

  const renderQuote = (quote: string, extendedIndex: number) => {
    const baseIndex = quotes.length === 0 ? extendedIndex : extendedIndex % quotes.length;
    const state = getCardState(baseIndex);

    const stateClasses =
      state === "focused"
        ? "text-violet-300 blur-0 opacity-100 scale-100"
        : state === "active"
          ? "text-zinc-100 blur-0 opacity-100 scale-100"
          : "text-zinc-500 blur-sm opacity-60 scale-95";

    const loopIndex =
      quotes.length === 0
        ? extendedIndex
        : Math.floor(extendedIndex / quotes.length);

    return (
      <li
        key={`${baseIndex}-${extendedIndex}`}
        data-base-index={baseIndex}
        data-loop-index={loopIndex}
        className="flex min-h-[34vh] items-center justify-center py-6 will-change-transform"
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
            <ul className="flex flex-col gap-4">
              {repeatedQuotes.map((quote, index) => renderQuote(quote, index))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

