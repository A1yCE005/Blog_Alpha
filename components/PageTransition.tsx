"use client";

import { useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import React from "react";

type PageTransitionProps = {
  children: React.ReactNode;
};

type OverlayPhase = "idle" | "covering" | "revealing";
type ContentPhase = "ready" | "fadingOut" | "preEnter" | "fadingIn";

const OVERLAY_FADE_IN_MS = 500;
const OVERLAY_HOLD_MS = 120;
const OVERLAY_FADE_OUT_MS = 520;

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [showOverlay, setShowOverlay] = React.useState(false);
  const overlayTimeoutRef = React.useRef<number | null>(null);
  const isInitialRenderRef = React.useRef(true);

  React.useEffect(() => {
    if (overlayTimeoutRef.current) {
      window.clearTimeout(overlayTimeoutRef.current);
      overlayTimeoutRef.current = null;
    }

    if (shouldReduceMotion) {
      setShowOverlay(false);
      isInitialRenderRef.current = false;
      return;
    }

    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      return;
    }

    setShowOverlay(true);

    overlayTimeoutRef.current = window.setTimeout(() => {
      setShowOverlay(false);
      overlayTimeoutRef.current = null;
    }, OVERLAY_VISIBLE_MS);

    return () => {
      if (overlayTimeoutRef.current) {
        window.clearTimeout(overlayTimeoutRef.current);
        overlayTimeoutRef.current = null;
      }
    };
  }, [pathname, shouldReduceMotion]);

  React.useEffect(() => {
    return () => {
      if (overlayTimeoutRef.current) {
        window.clearTimeout(overlayTimeoutRef.current);
      }
    };
  }, []);

  const [currentPath, setCurrentPath] = React.useState(pathname);
  const [renderedChildren, setRenderedChildren] = React.useState(children);
  const latestChildrenRef = React.useRef(children);

  const [overlayPhase, setOverlayPhase] = React.useState<OverlayPhase>("idle");
  const [contentPhase, setContentPhase] = React.useState<ContentPhase>("ready");
  const timersRef = React.useRef<number[]>([]);

  const clearTimers = React.useCallback(() => {
    if (timersRef.current.length === 0) {
      return;
    }
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  }, []);

  React.useEffect(() => {
    latestChildrenRef.current = children;
    if (pathname === currentPath) {
      setRenderedChildren(children);
    }
  }, [children, pathname, currentPath]);

  React.useEffect(() => {
    if (shouldReduceMotion) {
      clearTimers();
      setOverlayPhase("idle");
      setContentPhase("ready");
      setRenderedChildren(latestChildrenRef.current);
      setCurrentPath(pathname);
      return;
    }

    if (pathname === currentPath) {
      return;
    }

    clearTimers();
    setOverlayPhase("covering");
    setContentPhase("fadingOut");

    const coverId = window.setTimeout(() => {
      setRenderedChildren(latestChildrenRef.current);
      setCurrentPath(pathname);
      setContentPhase("preEnter");
      setOverlayPhase("revealing");

      const revealId = window.setTimeout(() => {
        setOverlayPhase("idle");
        setContentPhase("ready");
      }, OVERLAY_FADE_OUT_MS);

      timersRef.current.push(revealId);
    }, OVERLAY_FADE_IN_MS + OVERLAY_HOLD_MS);

    timersRef.current.push(coverId);

    return () => {
      clearTimers();
    };
  }, [pathname, currentPath, shouldReduceMotion, clearTimers]);

  React.useEffect(() => {
    if (contentPhase !== "preEnter") {
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      setContentPhase("fadingIn");
    });

    return () => window.cancelAnimationFrame(raf);
  }, [contentPhase]);

  React.useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const overlayBaseClass =
    "pointer-events-none fixed inset-0 z-40 bg-gradient-to-b from-transparent via-transparent to-black/40 transition-opacity duration-500 ease-out";

  const overlayClass =
    overlayPhase === "idle"
      ? `${overlayBaseClass} opacity-0`
      : overlayPhase === "covering"
        ? `${overlayBaseClass} pointer-events-auto opacity-100`
        : `${overlayBaseClass} opacity-0`;

  const isTransitioning = overlayPhase !== "idle" || contentPhase !== "ready";

  let contentClass =
    "relative min-h-screen overflow-x-hidden transition-[opacity,transform,filter] duration-500 ease-out";

  if (contentPhase === "fadingOut" || contentPhase === "preEnter") {
    contentClass += " pointer-events-none opacity-0 translate-y-5 blur-sm";
  } else if (contentPhase === "fadingIn") {
    contentClass += " pointer-events-none opacity-100 translate-y-0 blur-0";
  } else {
    contentClass += isTransitioning
      ? " pointer-events-none opacity-100"
      : " pointer-events-auto opacity-100";
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black">
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-black/40 transition-opacity duration-500 ease-out ${overlayOpacityClass}`}
      />

      {!shouldReduceMotion && <div aria-hidden className={overlayClass} />}

      <div className={shouldReduceMotion ? "relative min-h-screen overflow-x-hidden" : contentClass}>
        {shouldReduceMotion ? children : renderedChildren}
      </div>
    </div>
  );
}
