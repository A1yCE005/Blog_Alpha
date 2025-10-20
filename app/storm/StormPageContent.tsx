
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

type PointerMoveState = {
  startTime: number;
  lastTime: number;
  triggered: boolean;
};

type VirtualRange = {
  start: number;
  end: number;
};

export function StormPageContent({ quotes }: StormPageContentProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const totalItems = quotes.length;

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const idleTimeoutRef = React.useRef<number | null>(null);
  const focusUpdateRef = React.useRef<number | null>(null);
  const pointerMoveStateRef = React.useRef<PointerMoveState>({
    startTime: 0,
    lastTime: 0,
    triggered: false,
  });
  const measurementObserverRef = React.useRef<ResizeObserver | null>(null);
  const measurementNodeRef = React.useRef<HTMLLIElement | null>(null);

  const [itemHeight, setItemHeight] = React.useState<number | null>(null);
  const [virtualRange, setVirtualRange] = React.useState<VirtualRange>(() => ({
    start: 0,
    end: totalItems > 0 ? totalItems - 1 : -1,
  }));
  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const [isIdle, setIsIdle] = React.useState(() => !prefersReducedMotion);

  const initialFocusRef = React.useRef(0);
  const hasAlignedInitialFocusRef = React.useRef(false);
  const pendingFocusRef = React.useRef<number | null>(null);
  const isIdleRef = React.useRef(!prefersReducedMotion);

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

  const updateItemHeight = React.useCallback((height: number) => {
    if (!Number.isFinite(height) || height <= 0) {
      return;
    }
    setItemHeight((current) => {
      if (current === null || Math.abs(current - height) > 0.5) {
        return height;
      }
      return current;
    });
  }, []);

  const disconnectMeasurementObserver = React.useCallback(() => {
    if (measurementObserverRef.current) {
      measurementObserverRef.current.disconnect();
      measurementObserverRef.current = null;
    }
  }, []);

  const setMeasurementNode = React.useCallback(
    (node: HTMLLIElement | null) => {
      if (measurementNodeRef.current === node) {
        return;
      }
      disconnectMeasurementObserver();
      measurementNodeRef.current = node;
      if (node) {
        const observer = new ResizeObserver(() => {
          const height = node.getBoundingClientRect().height;
          updateItemHeight(height);
        });
        observer.observe(node);
        measurementObserverRef.current = observer;
        const height = node.getBoundingClientRect().height;
        updateItemHeight(height);
      }
    },
    [disconnectMeasurementObserver, updateItemHeight],
  );

  React.useEffect(() => {
    return () => {
      disconnectMeasurementObserver();
    };
  }, [disconnectMeasurementObserver]);

  const segment = React.useMemo(() => {
    if (itemHeight === null || totalItems === 0) {
      return 0;
    }
    return itemHeight * totalItems;
  }, [itemHeight, totalItems]);

  const updateVirtualRange = React.useCallback(() => {
    const container = containerRef.current;
    if (!container || itemHeight === null || totalItems === 0) {
      setVirtualRange({ start: 0, end: totalItems > 0 ? totalItems - 1 : -1 });
      return;
    }

    const viewportCount = Math.max(1, Math.ceil(container.clientHeight / itemHeight));
    const baseIndex = Math.floor(container.scrollTop / itemHeight);
    const maxIndex = totalItems * 3 - 1;
    const normalizedBase = Math.min(Math.max(baseIndex, 0), Math.max(0, maxIndex));
    const rangeBefore = viewportCount + OVERSCAN_ROWS;
    const start = Math.max(0, normalizedBase - rangeBefore);
    const end = Math.min(maxIndex, normalizedBase + viewportCount + OVERSCAN_ROWS);

    setVirtualRange((current) => {
      if (current.start === start && current.end === end) {
        return current;
      }
      return { start, end };
    });
  }, [itemHeight, totalItems]);

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
    if (!prefersReducedMotion) {
      if (idleTimeoutRef.current === null) {
        idleTimeoutRef.current = window.setTimeout(() => {
          scheduleFocusUpdate();
          isIdleRef.current = true;
          setIsIdle(true);
        }, IDLE_DELAY_MS);
      }
    } else {
      setIsIdle(false);
      isIdleRef.current = false;
      clearIdleTimeout();
    }

    return () => {
      clearIdleTimeout();
      if (focusUpdateRef.current !== null) {
        window.cancelAnimationFrame(focusUpdateRef.current);
        focusUpdateRef.current = null;
      }
    };
  }, [clearIdleTimeout, prefersReducedMotion, scheduleFocusUpdate]);

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
    setVirtualRange({ start: 0, end: totalItems > 0 ? totalItems - 1 : -1 });
  }, [totalItems]);

  React.useEffect(() => {
    updateVirtualRange();
  }, [itemHeight, totalItems, updateVirtualRange]);

  React.useEffect(() => {
    if (itemHeight !== null && totalItems > 0) {
      scheduleFocusUpdate();
    }
  }, [itemHeight, scheduleFocusUpdate, totalItems]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const resizeObserver = new ResizeObserver(() => {
      updateVirtualRange();
      scheduleFocusUpdate();
    });
    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
    };
  }, [scheduleFocusUpdate, updateVirtualRange]);

  React.useEffect(() => {
    if (totalItems === 0) {
      initialFocusRef.current = 0;
      setFocusedIndex(0);
      hasAlignedInitialFocusRef.current = true;
      return;
    }

    const nextIndex = Math.floor(Math.random() * totalItems);
    initialFocusRef.current = nextIndex;
    pendingFocusRef.current = nextIndex;
    setFocusedIndex(nextIndex);
    hasAlignedInitialFocusRef.current = false;
  }, [totalItems]);

  const alignToIndex = React.useCallback(
    (index: number) => {
      const container = containerRef.current;
      if (!container || segment === 0 || itemHeight === null || totalItems === 0) {
        return;
      }
      const basePosition = segment + index * itemHeight;
      const centered = basePosition - container.clientHeight / 2 + itemHeight / 2;
      let nextScrollTop = centered;
      if (nextScrollTop < segment) {
        nextScrollTop += segment;
      } else if (nextScrollTop >= segment * 2) {
        nextScrollTop -= segment;
      }
      const maxScroll = Math.max(0, segment * 3 - container.clientHeight);
      container.scrollTop = Math.max(0, Math.min(nextScrollTop, maxScroll));
      updateVirtualRange();
      scheduleFocusUpdate();
    },
    [itemHeight, scheduleFocusUpdate, segment, totalItems, updateVirtualRange],
  );

  React.useEffect(() => {
    if (segment === 0 || itemHeight === null || totalItems === 0) {
      return;
    }

    let frame: number | null = null;
    const align = () => {
      if (hasAlignedInitialFocusRef.current) {
        return;
      }
      const container = containerRef.current;
      if (!container) {
        frame = window.requestAnimationFrame(align);
        return;
      }
      alignToIndex(initialFocusRef.current);
      hasAlignedInitialFocusRef.current = true;
    };

    frame = window.requestAnimationFrame(align);

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [alignToIndex, itemHeight, segment, totalItems]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!prefersReducedMotion) {
      resetIdle();
    }
    const container = event.currentTarget;
    if (segment > 0) {
      if (container.scrollTop < segment) {
        container.scrollTop += segment;
      } else if (container.scrollTop >= segment * 2) {
        container.scrollTop -= segment;
      }
    }
    updateVirtualRange();
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

  const renderQuote = React.useCallback(
    (
      quote: string,
      baseIndex: number,
      key: string,
      options?: {
        style?: React.CSSProperties;
        refCallback?: (node: HTMLLIElement | null) => void;
      },
    ) => {
      const state = getCardState(baseIndex);
      const stateClasses =
        state === "focused"
          ? "text-violet-300 blur-0 opacity-100 scale-100"
          : state === "active"
            ? "text-zinc-100 blur-0 opacity-100 scale-100"
            : "text-zinc-500 blur-sm opacity-60 scale-95";

      return (
        <li
          key={key}
          data-base-index={baseIndex}
          ref={options?.refCallback}
          style={options?.style}
          className="flex min-h-[34vh] items-center justify-center py-6 will-change-transform"
        >
          <blockquote className={`max-w-3xl text-center text-2xl font-semibold leading-tight transition-all duration-500 ease-out sm:text-3xl ${stateClasses}`}>
            {quote}
          </blockquote>
        </li>
      );
    },
    [getCardState],
  );

  const virtualItems: React.ReactNode[] = React.useMemo(() => {
    if (totalItems === 0) {
      return [];
    }

    if (itemHeight === null) {
      return quotes.map((quote, index) =>
        renderQuote(quote, index, `initial-${index}`, {
          refCallback: index === 0 ? setMeasurementNode : undefined,
        }),
      );
    }

    if (virtualRange.end < virtualRange.start) {
      return [];
    }

    const items: React.ReactNode[] = [];
    for (let virtualIndex = virtualRange.start; virtualIndex <= virtualRange.end; virtualIndex += 1) {
      const normalizedIndex = ((virtualIndex % totalItems) + totalItems) % totalItems;
      const top = virtualIndex * itemHeight;
      items.push(
        renderQuote(quotes[normalizedIndex], normalizedIndex, `virtual-${virtualIndex}`, {
          refCallback: virtualIndex === virtualRange.start ? setMeasurementNode : undefined,
          style: {
            position: "absolute",
            top,
            left: 0,
            right: 0,
            height: itemHeight,
          },
        }),
      );
    }
    return items;
  }, [itemHeight, quotes, renderQuote, setMeasurementNode, totalItems, virtualRange.end, virtualRange.start]);

  const contentHeight = itemHeight !== null && totalItems > 0 ? itemHeight * totalItems * 3 : undefined;

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
            {itemHeight !== null && totalItems > 0 ? (
              <div className="relative w-full" style={{ height: contentHeight }}>
                <ul className="absolute inset-0">{virtualItems}</ul>
              </div>
            ) : (
              <ul className="flex flex-col gap-4">{virtualItems}</ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
