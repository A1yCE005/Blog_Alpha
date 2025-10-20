"use client";

import React from "react";
import Link from "next/link";

import { usePageTransition } from "@/hooks/usePageTransition";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type StormPageContentProps = {
  quotes: string[];
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
  const idleFrameRef = React.useRef<number | null>(null);
  const focusUpdateRef = React.useRef<number | null>(null);
  const hasAppliedInitialFocusRef = React.useRef(false);
  const initialFocusIndexRef = React.useRef(
    quotes.length > 0 ? Math.floor(Math.random() * quotes.length) : 0,
  );

  const [focusedIndex, setFocusedIndex] = React.useState(initialFocusIndexRef.current);
  const [isIdle, setIsIdle] = React.useState(() => !prefersReducedMotion);

  const cancelIdleFrame = React.useCallback(() => {
    if (idleFrameRef.current !== null) {
      window.cancelAnimationFrame(idleFrameRef.current);
      idleFrameRef.current = null;
    }
  }, []);

  const scheduleIdleFrame = React.useCallback(() => {
    if (prefersReducedMotion) {
      setIsIdle(false);
      cancelIdleFrame();
      return;
    }

    cancelIdleFrame();
    idleFrameRef.current = window.requestAnimationFrame(() => {
      idleFrameRef.current = null;
      setIsIdle(true);
    });
  }, [cancelIdleFrame, prefersReducedMotion]);

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

      setFocusedIndex((current) => (current === nearestIndex ? current : nearestIndex));
    });
  }, []);

  const resetIdle = React.useCallback(() => {
    if (prefersReducedMotion) {
      setIsIdle(false);
      return;
    }

    setIsIdle(false);
    scheduleIdleFrame();
  }, [prefersReducedMotion, scheduleIdleFrame]);

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

      if (!hasAppliedInitialFocusRef.current && quotes.length > 0) {
        const targetIndex = initialFocusIndexRef.current % quotes.length;
        const items = container.querySelectorAll<HTMLLIElement>("[data-base-index]");
        if (items.length > 0) {
          const middleItem = Array.from(items).find((item) => {
            const baseIndex = Number.parseInt(item.dataset.baseIndex ?? "0", 10);
            const repeatIndex = Number.parseInt(item.dataset.repeatIndex ?? "0", 10);
            return baseIndex === targetIndex && repeatIndex === 1;
          });

          if (middleItem) {
            const containerRect = container.getBoundingClientRect();
            const itemRect = middleItem.getBoundingClientRect();
            const offset = itemRect.top - containerRect.top;
            const adjustment = offset - containerRect.height / 2 + itemRect.height / 2;
            container.scrollTop = container.scrollTop + adjustment;
            setFocusedIndex(targetIndex);
            hasAppliedInitialFocusRef.current = true;
            scheduleFocusUpdate();
          }
        }
      }
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
    if (prefersReducedMotion) {
      setIsIdle(false);
      cancelIdleFrame();
      return;
    }

    scheduleIdleFrame();

    return () => {
      cancelIdleFrame();
    };
  }, [cancelIdleFrame, prefersReducedMotion, scheduleIdleFrame]);

  React.useEffect(() => {
    return () => {
      cancelIdleFrame();
      if (focusUpdateRef.current !== null) {
        window.cancelAnimationFrame(focusUpdateRef.current);
        focusUpdateRef.current = null;
      }
    };
  }, [cancelIdleFrame]);

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

  const handlePointerOrWheel = () => {
    if (!prefersReducedMotion) {
      resetIdle();
    }
  };

  const getCardState = (baseIndex: number) => {
    if (baseIndex === focusedIndex) {
      return "focused";
    }
    if (!isIdle) {
      return "active";
    }
    return "idle";
  };

  const renderQuote = (quote: string, extendedIndex: number) => {
    const baseIndex = quotes.length === 0 ? extendedIndex : extendedIndex % quotes.length;
    const repeatIndex = quotes.length === 0 ? 0 : Math.floor(extendedIndex / quotes.length);
    const state = getCardState(baseIndex);

    const baseClasses = "px-4 py-6 transition-all duration-500 sm:px-6 sm:py-8";

    const stateClasses =
      state === "focused"
        ? "text-violet-200 blur-0 opacity-100 scale-105"
        : state === "active"
          ? "text-zinc-200 blur-0 opacity-90 scale-100"
          : "text-zinc-500 blur-sm opacity-60 scale-95";

    return (
      <li
        key={`${baseIndex}-${extendedIndex}`}
        data-base-index={baseIndex}
        data-repeat-index={repeatIndex}
        className="will-change-transform"
      >
        <figure className={`${baseClasses} ${stateClasses}`}>
          <blockquote className="text-center text-xl font-semibold leading-relaxed sm:text-2xl">
            {quote}
          </blockquote>
        </figure>
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
        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-10 sm:px-10">
          <div className="flex justify-end pb-6">
            <Link
              href="/"
              onClick={(event) => handleLinkClick(event, "/")}
              className="inline-flex w-fit items-center gap-2 text-sm font-semibold uppercase tracking-[0.35em] text-zinc-600 transition-colors duration-200 hover:text-violet-200"
              tabIndex={isInteractive ? undefined : -1}
            >
              <span aria-hidden>←</span> Back to the cloud
            </Link>
          </div>

          <div
            ref={containerRef}
            className="relative flex flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            onScroll={handleScroll}
            onWheel={handlePointerOrWheel}
            onPointerDown={handlePointerOrWheel}
            onPointerMove={handlePointerOrWheel}
            onPointerUp={handlePointerOrWheel}
            onTouchStart={handlePointerOrWheel}
            onTouchEnd={handlePointerOrWheel}
            onFocus={handlePointerOrWheel}
            onKeyDown={handlePointerOrWheel}
            aria-label="Storm quotes"
            tabIndex={isInteractive ? 0 : -1}
          >
            <ul className="flex w-full flex-col items-center justify-center gap-16 py-16">
              {repeatedQuotes.map((quote, index) => renderQuote(quote, index))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

