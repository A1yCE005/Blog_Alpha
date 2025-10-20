"use client";

import React from "react";
import Link from "next/link";

import type { StormQuote } from "@/lib/storm";
import { usePageTransition } from "@/hooks/usePageTransition";

const LOOP_COUNT = 3;
const IDLE_TIMEOUT_MS = 2500;

type QuoteRenderItem = StormQuote & {
  key: string;
};

type StormPageContentProps = {
  quotes: StormQuote[];
};

export function StormPageContent({ quotes }: StormPageContentProps) {
  const { isTransitioning, handleLinkClick } = usePageTransition("storm");
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const itemRefs = React.useRef(new Map<string, HTMLDivElement | null>());
  const [activeKey, setActiveKey] = React.useState<string | null>(null);
  const [isIdle, setIsIdle] = React.useState(true);
  const repeatedQuotes = React.useMemo<QuoteRenderItem[]>(() => {
    if (quotes.length === 0) {
      return [];
    }

    return Array.from({ length: LOOP_COUNT }, (_, loopIndex) =>
      quotes.map((quote, index) => ({
        ...quote,
        key: `${loopIndex}:${index}`,
      }))
    ).flat();
  }, [quotes]);

  const registerItemRef = React.useCallback(
    (key: string) => (node: HTMLDivElement | null) => {
      if (node) {
        itemRefs.current.set(key, node);
      } else {
        itemRefs.current.delete(key);
      }
    },
    []
  );

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || quotes.length === 0) {
      return;
    }

    const initialize = () => {
      const totalHeight = container.scrollHeight;
      if (totalHeight === 0) {
        return;
      }
      const blockHeight = totalHeight / LOOP_COUNT;
      container.scrollTop = blockHeight;
    };

    const raf = requestAnimationFrame(initialize);
    return () => cancelAnimationFrame(raf);
  }, [quotes]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || quotes.length === 0) {
      return undefined;
    }

    let ticking = false;

    const handleScroll = () => {
      if (ticking) {
        return;
      }
      ticking = true;
      requestAnimationFrame(() => {
        const totalHeight = container.scrollHeight;
        if (totalHeight === 0) {
          ticking = false;
          return;
        }
        const blockHeight = totalHeight / LOOP_COUNT;
        const minThreshold = blockHeight * 0.4;
        const maxThreshold = blockHeight * (LOOP_COUNT - 1 - 0.4);
        if (container.scrollTop <= minThreshold) {
          container.scrollTop += blockHeight;
        } else if (container.scrollTop >= maxThreshold) {
          container.scrollTop -= blockHeight;
        }
        ticking = false;
      });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [quotes]);

  React.useEffect(() => {
    if (repeatedQuotes.length === 0) {
      setActiveKey(null);
      return undefined;
    }

    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        let bestEntry: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
            bestEntry = entry;
          }
        }

        if (!bestEntry) {
          return;
        }

        const key = (bestEntry.target as HTMLElement).dataset.key ?? null;
        setActiveKey((previous) => (previous === key ? previous : key));
      },
      {
        root: container,
        threshold: [0.35, 0.5, 0.65, 0.8],
      }
    );

    for (const [key, element] of itemRefs.current.entries()) {
      if (element) {
        element.dataset.key = key;
        observer.observe(element);
      }
    }

    return () => observer.disconnect();
  }, [repeatedQuotes]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    let idleTimeout: ReturnType<typeof setTimeout> | null = null;

    const setIdle = () => setIsIdle(true);
    const handleActivity = () => {
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }
      setIsIdle(false);
      idleTimeout = setTimeout(setIdle, IDLE_TIMEOUT_MS);
    };

    handleActivity();

    window.addEventListener("wheel", handleActivity, { passive: true });
    window.addEventListener("touchmove", handleActivity, { passive: true });
    window.addEventListener("pointermove", handleActivity);
    window.addEventListener("keydown", handleActivity);

    return () => {
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }
      window.removeEventListener("wheel", handleActivity);
      window.removeEventListener("touchmove", handleActivity);
      window.removeEventListener("pointermove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, []);

  React.useEffect(() => {
    if (repeatedQuotes.length === 0) {
      return;
    }
    const middleIndex = quotes.length;
    const fallback = repeatedQuotes[middleIndex] ?? repeatedQuotes[0];
    if (fallback) {
      setActiveKey(fallback.key);
    }
  }, [repeatedQuotes, quotes.length]);

  const isInteractive = !isTransitioning;

  return (
    <>
      <div
        aria-hidden
        className={`page-transition-overlay ${isTransitioning ? "page-transition-overlay-active" : ""}`}
      />
      <div
        className={`relative min-h-screen bg-black page-fade-in transition-opacity duration-300 ease-out ${
          isTransitioning ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 pb-20 pt-16 sm:px-10">
          <header className="flex flex-col gap-6 text-left">
            <Link
              href="/?view=blog"
              onClick={(event) => handleLinkClick(event, "/?view=blog")}
              className="inline-flex w-fit items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500 transition-colors duration-200 hover:text-violet-200"
              tabIndex={isInteractive ? undefined : -1}
            >
              <span aria-hidden>←</span> Back to the cloud
            </Link>
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300/80">Signal Deck</p>
              <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">Storm</h1>
              <p className="max-w-2xl text-sm text-zinc-400 sm:text-base">
                Quotes gathered from the Lighthouse studio. Scroll to cycle through the weather; the storm loops endlessly.
              </p>
            </div>
          </header>

          {repeatedQuotes.length === 0 ? (
            <div className="mt-16 flex flex-1 items-center justify-center">
              <p className="rounded-3xl border border-white/10 bg-white/5 px-8 py-6 text-center text-sm text-zinc-400">
                No storm signals available yet. Add quotes to <code>content/posts/storm/storm.md</code> to activate this page.
              </p>
            </div>
          ) : (
            <div className="relative mt-14 flex-1">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black via-black/60 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black via-black/60 to-transparent" />
              <div
                ref={containerRef}
                className={`storm-scroll-container relative h-full overflow-y-auto py-10 ${
                  isInteractive ? "pointer-events-auto" : "pointer-events-none"
                }`}
                tabIndex={isInteractive ? 0 : -1}
              >
                <div className="flex flex-col gap-12">
                  {repeatedQuotes.map((quote) => {
                    const isActive = activeKey === quote.key;
                    const isDimmed = isIdle && !isActive;

                    return (
                      <div
                        key={quote.key}
                        ref={registerItemRef(quote.key)}
                        className={`scroll-mt-36 scroll-mb-36 rounded-3xl border border-white/10 px-8 py-10 text-center transition-all duration-500 ease-out sm:px-12 sm:py-14 ${
                          isActive
                            ? "bg-white/10 text-zinc-50 shadow-[0_0_40px_rgba(168,85,247,0.15)]"
                            : "bg-white/5 text-zinc-300"
                        } ${isDimmed ? "blur-sm opacity-40" : "opacity-80"}`.trim()}
                        style={{ scrollSnapAlign: "center" }}
                      >
                        <p className="text-xl font-medium leading-relaxed sm:text-2xl">{quote.text}</p>
                        {quote.source && (
                          <p className="mt-6 text-sm uppercase tracking-[0.3em] text-violet-200/70">
                            {quote.source}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
