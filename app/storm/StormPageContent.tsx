"use client";

import React from "react";

import { usePageTransition } from "@/hooks/usePageTransition";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type StormPageContentProps = {
  title: string;
  description?: string;
  quotes: string[];
};

const IDLE_DELAY_MS = 0;

export function StormPageContent({ title: _title, description: _description, quotes }: StormPageContentProps) {
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

  const initialFocusIndex = React.useMemo(
    () => (quotes.length > 0 ? Math.floor(Math.random() * quotes.length) : 0),
    [quotes],
  );

  const [focusedIndex, setFocusedIndex] = React.useState(initialFocusIndex);
  const [isIdle, setIsIdle] = React.useState(() => !prefersReducedMotion);
  const hasPositionedInitialFocusRef = React.useRef(false);

  React.useEffect(() => {
    setFocusedIndex(initialFocusIndex);
    hasPositionedInitialFocusRef.current = false;
  }, [initialFocusIndex]);

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

      setFocusedIndex((current) => (current === nearestIndex ? current : nearestIndex));
    });
  }, []);

  const resetIdle = React.useCallback(() => {
    if (prefersReducedMotion) {
      setIsIdle(false);
      return;
    }

    setIsIdle(false);
    clearIdleTimeout();
    idleTimeoutRef.current = window.setTimeout(() => {
      setIsIdle(true);
    }, IDLE_DELAY_MS);
  }, [clearIdleTimeout, prefersReducedMotion]);

  const { isTransitioning } = usePageTransition("storm");
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

      if (!hasPositionedInitialFocusRef.current && quotes.length > 0) {
        const targetExtendedIndex = quotes.length + initialFocusIndex;
        const targetItem = container.querySelector<HTMLElement>(
          `[data-extended-index="${targetExtendedIndex}"]`,
        );

        if (targetItem) {
          const containerHeight = container.clientHeight;
          const targetOffset = targetItem.offsetTop + targetItem.offsetHeight / 2;
          container.scrollTop = targetOffset - containerHeight / 2;
          hasPositionedInitialFocusRef.current = true;
          setFocusedIndex(initialFocusIndex);
        }
      }

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
  }, [initialFocusIndex, quotes, scheduleFocusUpdate]);

  React.useEffect(() => {
    scheduleFocusUpdate();
  }, [repeatedQuotes, scheduleFocusUpdate]);

  React.useEffect(() => {
    if (prefersReducedMotion) {
      setIsIdle(false);
      clearIdleTimeout();
      return;
    }

    if (idleTimeoutRef.current === null) {
      idleTimeoutRef.current = window.setTimeout(() => {
        setIsIdle(true);
      }, IDLE_DELAY_MS);
    }

    return () => {
      clearIdleTimeout();
    };
  }, [clearIdleTimeout, prefersReducedMotion]);

  React.useEffect(() => {
    return () => {
      clearIdleTimeout();
      if (focusUpdateRef.current !== null) {
        window.cancelAnimationFrame(focusUpdateRef.current);
        focusUpdateRef.current = null;
      }
    };
  }, [clearIdleTimeout]);

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
    const state = getCardState(baseIndex);

    const baseClasses = "px-6 py-16 text-center font-bold text-2xl leading-snug transition-all duration-500 sm:px-10 sm:text-3xl";

    const stateClasses =
      state === "focused"
        ? "text-violet-200 blur-0 scale-100 opacity-100"
        : state === "active"
          ? "text-zinc-300 blur-0 opacity-85 scale-[0.99]"
          : "text-zinc-600 blur-sm opacity-60 scale-95";

    return (
      <li
        key={`${baseIndex}-${extendedIndex}`}
        data-base-index={baseIndex}
        data-extended-index={extendedIndex}
        className="flex min-h-[60vh] items-center justify-center will-change-transform"
      >
        <figure className={`${baseClasses} ${stateClasses}`}>
          <blockquote className="leading-tight">{quote}</blockquote>
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
        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-16 sm:px-10">
          <div
            ref={containerRef}
            className="relative -mx-2 flex-1 overflow-y-auto px-2 pb-12 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            onScroll={handleScroll}
            onWheel={handlePointerOrWheel}
            onPointerDown={handlePointerOrWheel}
            onPointerMove={handlePointerOrWheel}
            onTouchStart={handlePointerOrWheel}
            onFocus={handlePointerOrWheel}
            onKeyDown={handlePointerOrWheel}
            aria-label="Storm quotes"
            tabIndex={isInteractive ? 0 : -1}
          >
            <ul className="flex flex-col gap-12 pb-24">
              {repeatedQuotes.map((quote, index) => renderQuote(quote, index))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

