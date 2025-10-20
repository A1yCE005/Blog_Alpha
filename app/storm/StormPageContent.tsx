"use client";

import React from "react";
import Link from "next/link";

import { usePageTransition } from "@/hooks/usePageTransition";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { StormQuote } from "@/lib/storm";

const WHEEL_THRESHOLD = 55;
const TOUCH_THRESHOLD = 40;
const IDLE_TIMEOUT_MS = 2200;

function mod(value: number, modulo: number) {
  return ((value % modulo) + modulo) % modulo;
}

function getCircularOffset(index: number, activeIndex: number, total: number) {
  let offset = index - activeIndex;
  if (offset > total / 2) {
    offset -= total;
  } else if (offset < -total / 2) {
    offset += total;
  }
  return offset;
}

type StormPageContentProps = {
  title: string;
  description: string;
  quotes: StormQuote[];
};

export function StormPageContent({ title, description, quotes }: StormPageContentProps) {
  const totalQuotes = quotes.length;
  const prefersReducedMotion = usePrefersReducedMotion();
  const { isTransitioning, handleLinkClick } = usePageTransition("storm");
  const isInteractive = !isTransitioning;
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isInteracting, setIsInteracting] = React.useState(false);
  const idleTimeoutRef = React.useRef<number | null>(null);
  const wheelDeltaRef = React.useRef(0);
  const touchStartRef = React.useRef<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    return () => {
      if (idleTimeoutRef.current !== null) {
        window.clearTimeout(idleTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!isInteractive) {
      return;
    }
    const container = containerRef.current;
    if (container && !container.contains(document.activeElement)) {
      container.focus({ preventScroll: true });
    }
  }, [isInteractive]);

  const scheduleIdleReset = React.useCallback(() => {
    if (idleTimeoutRef.current !== null) {
      window.clearTimeout(idleTimeoutRef.current);
    }
    idleTimeoutRef.current = window.setTimeout(() => {
      setIsInteracting(false);
    }, IDLE_TIMEOUT_MS);
  }, []);

  const markInteraction = React.useCallback(() => {
    setIsInteracting(true);
    scheduleIdleReset();
  }, [scheduleIdleReset]);

  const changeQuote = React.useCallback(
    (delta: number) => {
      if (totalQuotes <= 0) {
        return;
      }
      setActiveIndex((previous) => mod(previous + delta, totalQuotes));
    },
    [totalQuotes]
  );

  const handleWheel = React.useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (!isInteractive || totalQuotes <= 1) {
        return;
      }
      event.preventDefault();
      markInteraction();
      wheelDeltaRef.current += event.deltaY;
      if (wheelDeltaRef.current > WHEEL_THRESHOLD) {
        wheelDeltaRef.current = 0;
        changeQuote(1);
      } else if (wheelDeltaRef.current < -WHEEL_THRESHOLD) {
        wheelDeltaRef.current = 0;
        changeQuote(-1);
      }
    },
    [changeQuote, isInteractive, markInteraction, totalQuotes]
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isInteractive || totalQuotes === 0) {
        return;
      }

      if (event.key === "ArrowDown" || event.key === "j") {
        event.preventDefault();
        markInteraction();
        changeQuote(1);
      } else if (event.key === "ArrowUp" || event.key === "k") {
        event.preventDefault();
        markInteraction();
        changeQuote(-1);
      } else if (event.key === "Home") {
        event.preventDefault();
        markInteraction();
        setActiveIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        markInteraction();
        setActiveIndex(totalQuotes > 0 ? totalQuotes - 1 : 0);
      }
    },
    [changeQuote, isInteractive, markInteraction, totalQuotes]
  );

  const handleTouchStart = React.useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (!isInteractive || totalQuotes <= 1) {
        return;
      }
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      touchStartRef.current = touch.clientY;
      markInteraction();
    },
    [isInteractive, markInteraction, totalQuotes]
  );

  const handleTouchMove = React.useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (!isInteractive || totalQuotes <= 1) {
        return;
      }
      const startY = touchStartRef.current;
      if (startY === null) {
        return;
      }
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      const delta = startY - touch.clientY;
      if (Math.abs(delta) < TOUCH_THRESHOLD) {
        return;
      }
      touchStartRef.current = touch.clientY;
      changeQuote(delta > 0 ? 1 : -1);
    },
    [changeQuote, isInteractive, totalQuotes]
  );

  const handleTouchEnd = React.useCallback(() => {
    touchStartRef.current = null;
  }, []);

  React.useEffect(() => {
    if (totalQuotes === 0) {
      setActiveIndex(0);
    } else if (activeIndex >= totalQuotes) {
      setActiveIndex(mod(activeIndex, totalQuotes));
    }
  }, [activeIndex, totalQuotes]);

  const visibleEntries = React.useMemo(() => {
    if (totalQuotes === 0) {
      return [] as Array<{ quote: StormQuote; index: number; offset: number }>;
    }

    if (totalQuotes <= 5) {
      return quotes
        .map((quote, index) => ({
          quote,
          index,
          offset: getCircularOffset(index, activeIndex, totalQuotes),
        }))
        .sort((a, b) => a.offset - b.offset);
    }

    const offsets = [-2, -1, 0, 1, 2];
    return offsets.map((offset) => {
      const index = mod(activeIndex + offset, totalQuotes);
      return {
        quote: quotes[index]!,
        index,
        offset,
      };
    });
  }, [activeIndex, quotes, totalQuotes]);

  return (
    <>
      <div
        aria-hidden
        className={`page-transition-overlay ${isTransitioning ? "page-transition-overlay-active" : ""}`}
      />
      <div
        className={`relative min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950/95 to-black page-fade-in transition-opacity duration-300 ease-out ${
          isTransitioning ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-16 sm:px-10">
          <header className="flex flex-col gap-6">
            <Link
              href="/?view=blog"
              onClick={(event) => handleLinkClick(event, "/?view=blog")}
              className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.35em] text-zinc-500 transition-colors duration-200 hover:text-violet-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-500/40"
              tabIndex={isInteractive ? undefined : -1}
            >
              <span aria-hidden>←</span> Back to the cloud
            </Link>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300/80">Storm</p>
              <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">{title}</h1>
              {description && (
                <p className="max-w-2xl text-base text-zinc-400">{description}</p>
              )}
            </div>
          </header>

          <div className="relative mt-16 flex flex-1 flex-col items-center">
            {totalQuotes === 0 ? (
              <div className="flex flex-1 items-center justify-center text-center text-zinc-500">
                <p>No quotes available yet. Add entries to <code>storm.md</code> to fill the storm.</p>
              </div>
            ) : (
              <div
                ref={containerRef}
                role="listbox"
                aria-label="Storm quotes"
                tabIndex={isInteractive ? 0 : -1}
                onWheel={handleWheel}
                onKeyDown={handleKeyDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onPointerDown={isInteractive ? markInteraction : undefined}
                onPointerMove={isInteractive ? markInteraction : undefined}
                className="relative flex w-full max-w-3xl flex-1 flex-col items-stretch justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400/40"
              >
                <ul className="relative flex flex-1 list-none flex-col items-stretch justify-center gap-6">
                  {visibleEntries.map(({ quote, index, offset }) => {
                    const distance = Math.abs(offset);
                    const isActive = offset === 0;
                    const blurClass = !isInteracting && !isActive ? "blur-[2px] sm:blur-[4px]" : "blur-0";
                    const baseOpacity = isActive ? 1 : Math.max(0.24, 1 - distance * 0.28);
                    const translateY = prefersReducedMotion ? 0 : offset * 88;
                    const scale = prefersReducedMotion ? 1 : 1 - Math.min(distance, 3) * 0.08;

                    return (
                      <li key={`${index}-${offset}`} className="flex items-center justify-center">
                        <button
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onClick={() => {
                            if (!isInteractive) {
                              return;
                            }
                            markInteraction();
                            setActiveIndex(index);
                          }}
                          className={`group relative w-full rounded-[2rem] border border-white/10 bg-zinc-950/70 px-8 py-10 text-left shadow-[0_18px_48px_rgba(76,29,149,0.16)] transition-[filter,transform,opacity] duration-500 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400/50 ${
                            blurClass
                          } ${isActive ? "ring-1 ring-violet-400/30" : "ring-0"}`}
                          style={{
                            opacity: baseOpacity,
                            transform: `translateY(${translateY}px) scale(${scale})`,
                          }}
                          tabIndex={isInteractive ? 0 : -1}
                        >
                          <p className={`text-lg leading-relaxed text-zinc-100 sm:text-xl ${isActive ? "font-semibold" : ""}`}>
                            {quote.text}
                          </p>
                          {quote.source && (
                            <p className="mt-6 text-sm uppercase tracking-[0.3em] text-zinc-500">
                              — {quote.source}
                            </p>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="pointer-events-none absolute inset-x-0 -top-12 h-24 bg-gradient-to-b from-black via-black/40 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 -bottom-12 h-24 bg-gradient-to-t from-black via-black/40 to-transparent" />
              </div>
            )}
          </div>

          {totalQuotes > 0 && (
            <footer className="mt-12 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-zinc-500">
              <span>
                {String(activeIndex + 1).padStart(2, "0")} / {String(totalQuotes).padStart(2, "0")}
              </span>
              <span>Scroll or tap to orbit</span>
            </footer>
          )}
        </div>
      </div>
    </>
  );
}
