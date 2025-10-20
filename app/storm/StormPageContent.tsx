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
  const idleCheckRafRef = React.useRef<number | null>(null);
  const focusUpdateRef = React.useRef<number | null>(null);
  const initialFocusIndexRef = React.useRef<number | null>(null);
  const hasPositionedInitialFocusRef = React.useRef(false);

  if (initialFocusIndexRef.current === null) {
    initialFocusIndexRef.current = quotes.length > 0 ? Math.floor(Math.random() * quotes.length) : 0;
  }

  const [focusedIndex, setFocusedIndex] = React.useState(initialFocusIndexRef.current ?? 0);
  const [isIdle, setIsIdle] = React.useState(() => !prefersReducedMotion);

  const cancelIdleCheck = React.useCallback(() => {
    if (idleCheckRafRef.current !== null) {
      window.cancelAnimationFrame(idleCheckRafRef.current);
      idleCheckRafRef.current = null;
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

  const markActive = React.useCallback(() => {
    if (prefersReducedMotion) {
      setIsIdle(false);
      return;
    }

    setIsIdle(false);
    cancelIdleCheck();
  }, [cancelIdleCheck, prefersReducedMotion]);

  const scheduleIdleCheck = React.useCallback(() => {
    if (prefersReducedMotion) {
      return;
    }

    cancelIdleCheck();
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let lastScrollTop = container.scrollTop;
    const check = () => {
      const target = containerRef.current;
      if (!target) {
        idleCheckRafRef.current = null;
        return;
      }

      const currentScrollTop = target.scrollTop;
      if (Math.abs(currentScrollTop - lastScrollTop) < 0.5) {
        idleCheckRafRef.current = null;
        setIsIdle(true);
        return;
      }

      lastScrollTop = currentScrollTop;
      idleCheckRafRef.current = window.requestAnimationFrame(check);
    };

    idleCheckRafRef.current = window.requestAnimationFrame(check);
  }, [cancelIdleCheck, prefersReducedMotion]);

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
    if (prefersReducedMotion) {
      setIsIdle(false);
      cancelIdleCheck();
      return;
    }

    setIsIdle(true);
  }, [cancelIdleCheck, prefersReducedMotion]);

  React.useEffect(() => {
    scheduleFocusUpdate();
  }, [repeatedQuotes, scheduleFocusUpdate]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || quotes.length === 0) {
      return;
    }

    if (hasPositionedInitialFocusRef.current) {
      return;
    }

    const targetIndex = quotes.length + (initialFocusIndexRef.current ?? 0);
    const items = container.querySelectorAll<HTMLLIElement>("[data-base-index]");
    if (items.length === 0 || targetIndex >= items.length) {
      return;
    }

    const targetItem = items[targetIndex];
    if (!targetItem) {
      return;
    }

    hasPositionedInitialFocusRef.current = true;
    window.requestAnimationFrame(() => {
      const activeContainer = containerRef.current;
      if (!activeContainer) {
        return;
      }

      const offset = targetItem.offsetTop - activeContainer.clientHeight / 2 + targetItem.clientHeight / 2;
      activeContainer.scrollTop = offset;
      setFocusedIndex(initialFocusIndexRef.current ?? 0);
      scheduleFocusUpdate();
    });
  }, [quotes.length, scheduleFocusUpdate]);

  React.useEffect(() => {
    return () => {
      cancelIdleCheck();
      if (focusUpdateRef.current !== null) {
        window.cancelAnimationFrame(focusUpdateRef.current);
        focusUpdateRef.current = null;
      }
    };
  }, [cancelIdleCheck]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    markActive();
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
    scheduleIdleCheck();
  };

  const handlePointerDown = () => {
    markActive();
  };

  const handlePointerMove = () => {
    markActive();
    scheduleIdleCheck();
  };

  const handleWheel = () => {
    markActive();
    scheduleIdleCheck();
  };

  const handlePointerUp = () => {
    if (prefersReducedMotion) {
      return;
    }
    cancelIdleCheck();
    setIsIdle(true);
  };

  const handleKeyDown = () => {
    markActive();
  };

  const handleKeyUp = () => {
    scheduleIdleCheck();
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

    const baseClasses =
      "mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center px-6 text-center transition-all duration-500 sm:px-10";

    const stateClasses =
      state === "focused"
        ? "text-violet-300 blur-0 opacity-100 drop-shadow-[0_0_32px_rgba(167,139,250,0.35)] scale-[1.02]"
        : state === "active"
          ? "text-zinc-200 blur-0 opacity-95 scale-100"
          : "text-zinc-500 blur-sm opacity-60 scale-95";

    return (
      <li
        key={`${baseIndex}-${extendedIndex}`}
        data-base-index={baseIndex}
        className="flex will-change-transform"
        aria-current={state === "focused" ? "true" : undefined}
      >
        <figure className={`${baseClasses} ${stateClasses}`}>
          <blockquote className="text-2xl font-semibold leading-relaxed tracking-tight sm:text-3xl">
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
        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-10 sm:px-12">
          <div className="pb-10">
            <Link
              href="/"
              onClick={(event) => handleLinkClick(event, "/")}
              className="inline-flex w-fit items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 transition-colors duration-200 hover:text-violet-200"
              tabIndex={isInteractive ? undefined : -1}
            >
              <span aria-hidden>←</span> Back to the cloud
            </Link>
          </div>
          <div
            ref={containerRef}
            className="relative flex-1 overflow-y-auto pb-16 storm-scroll"
            onScroll={handleScroll}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            onFocus={handlePointerDown}
            onBlur={handlePointerUp}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            aria-label="Storm quotes"
            tabIndex={isInteractive ? 0 : -1}
          >
            <ul className="flex flex-col gap-10">
              {repeatedQuotes.map((quote, index) => renderQuote(quote, index))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

