"use client";

import Link from "next/link";
import React from "react";

import type { StormContent } from "@/lib/storm";
import { usePageTransition } from "@/hooks/usePageTransition";

const IDLE_TIMEOUT_MS = 2000;

const USER_ACTIVITY_EVENTS: Array<keyof DocumentEventMap> = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "touchmove",
];

const SCROLL_ACTIVITY_EVENTS: Array<keyof HTMLElementEventMap> = ["wheel", "touchstart", "touchmove"]; // passive events

type StormPageContentProps = StormContent & {
  backHref?: string;
};

type IdleState = {
  isIdle: boolean;
  registerActivity: () => void;
};

function useIdleState(): IdleState {
  const [isIdle, setIsIdle] = React.useState(true);
  const idleTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearIdleTimeout = React.useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
  }, []);

  const registerActivity = React.useCallback(() => {
    clearIdleTimeout();
    setIsIdle(false);
    idleTimeoutRef.current = setTimeout(() => {
      setIsIdle(true);
      idleTimeoutRef.current = null;
    }, IDLE_TIMEOUT_MS);
  }, [clearIdleTimeout]);

  React.useEffect(() => {
    return () => {
      clearIdleTimeout();
    };
  }, [clearIdleTimeout]);

  return { isIdle, registerActivity };
}

export function StormPageContent({ title, description, quotes, backHref = "/?view=blog" }: StormPageContentProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const adjustScrollRef = React.useRef(false);
  const { isIdle, registerActivity } = useIdleState();
  const { isTransitioning, handleLinkClick } = usePageTransition("storm");
  const [activeIndex, setActiveIndex] = React.useState(0);

  const extendedQuotes = React.useMemo(() => {
    if (quotes.length === 0) {
      return [] as StormContent["quotes"];
    }
    return Array.from({ length: 3 }, () => quotes).flat();
  }, [quotes]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || quotes.length === 0) {
      return;
    }

    const initializeScrollPosition = () => {
      const { clientHeight } = container;
      if (clientHeight === 0) {
        return;
      }
      container.scrollTop = clientHeight * quotes.length;
      setActiveIndex(0);
    };

    const onResize = () => {
      initializeScrollPosition();
    };

    initializeScrollPosition();

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [quotes.length]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || quotes.length === 0) {
      return;
    }

    let animationFrame = 0;

    const updateActiveIndex = () => {
      const { scrollTop, clientHeight } = container;
      if (clientHeight === 0) {
        return;
      }

      const totalQuotes = quotes.length;
      const relativeIndex = Math.floor((scrollTop + clientHeight / 2) / clientHeight);
      const baseIndex = ((relativeIndex % totalQuotes) + totalQuotes) % totalQuotes;
      setActiveIndex(baseIndex);

      if (relativeIndex < totalQuotes) {
        adjustScrollRef.current = true;
        container.scrollTop = scrollTop + totalQuotes * clientHeight;
      } else if (relativeIndex >= totalQuotes * 2) {
        adjustScrollRef.current = true;
        container.scrollTop = scrollTop - totalQuotes * clientHeight;
      }
    };

    const onScroll = () => {
      if (adjustScrollRef.current) {
        adjustScrollRef.current = false;
        return;
      }

      registerActivity();
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(updateActiveIndex);
    };

    const handleActivity = () => {
      registerActivity();
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    SCROLL_ACTIVITY_EVENTS.forEach((eventName) => {
      container.addEventListener(eventName, handleActivity, { passive: true });
    });

    USER_ACTIVITY_EVENTS.forEach((eventName) => {
      document.addEventListener(eventName, handleActivity, { passive: true });
    });

    return () => {
      cancelAnimationFrame(animationFrame);
      container.removeEventListener("scroll", onScroll);
      SCROLL_ACTIVITY_EVENTS.forEach((eventName) => {
        container.removeEventListener(eventName, handleActivity);
      });
      USER_ACTIVITY_EVENTS.forEach((eventName) => {
        document.removeEventListener(eventName, handleActivity);
      });
    };
  }, [quotes.length, registerActivity]);

  const isInteractive = !isTransitioning;

  if (quotes.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-200">
        <p>No storm fragments available yet.</p>
      </div>
    );
  }

  return (
    <>
      <div aria-hidden className={`page-transition-overlay ${isTransitioning ? "page-transition-overlay-active" : ""}`} />
      <div
        className={`relative min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black page-fade-in transition-opacity duration-300 ease-out ${
          isInteractive ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.2),transparent_60%)]" />
        <div className="relative z-10 mx-auto flex h-screen max-w-4xl flex-col px-6 pb-12 pt-16 sm:px-10">
          <header className="mb-6 flex flex-col gap-2 text-left">
            <Link
              href={backHref}
              onClick={(event) => handleLinkClick(event, backHref)}
              className="inline-flex w-fit items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 transition-colors duration-200 hover:text-violet-200"
              tabIndex={isInteractive ? undefined : -1}
            >
              <span aria-hidden>←</span> Back to the cloud
            </Link>
            <h1 className="text-3xl font-semibold text-zinc-100 sm:text-4xl">{title}</h1>
            {description ? <p className="text-sm text-zinc-400 sm:text-base">{description}</p> : null}
          </header>

          <div
            ref={containerRef}
            className={`relative flex-1 overflow-y-auto snap-y snap-mandatory rounded-[2.5rem] border border-white/10 bg-black/40 shadow-[0_0_80px_rgba(124,58,237,0.25)] backdrop-blur-sm transition-opacity duration-300 ${
              isInteractive ? "pointer-events-auto" : "pointer-events-none"
            }`}
            tabIndex={isInteractive ? 0 : -1}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,114,182,0.05),transparent_70%)]" aria-hidden />
            <div className="relative z-10 flex h-full flex-col">
              {extendedQuotes.map((quote, index) => {
                const baseIndex = index % quotes.length;
                const inPrimaryBand = index >= quotes.length && index < quotes.length * 2;
                const isActive = inPrimaryBand && baseIndex === activeIndex;
                const shouldBlur = isIdle && !isActive;
                return (
                  <section
                    key={`${baseIndex}-${index}`}
                    className={`flex h-screen min-h-full snap-center flex-col items-center justify-center px-6 text-center transition-all duration-500 ease-out sm:px-12 ${
                      isActive ? "scale-100" : "scale-95"
                    } ${shouldBlur ? "blur-sm opacity-50" : "blur-0 opacity-100"}`}
                    aria-hidden={inPrimaryBand ? undefined : true}
                  >
                    <p className="text-2xl font-medium leading-snug text-zinc-100 sm:text-3xl">
                      “{quote.text}”
                    </p>
                    {quote.attribution ? (
                      <p className="mt-6 text-sm uppercase tracking-[0.3em] text-violet-300/80">{quote.attribution}</p>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
