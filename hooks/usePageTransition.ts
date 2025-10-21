"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const MIN_VISIBLE_DURATION_MS = 220;
const FALLBACK_RESET_MS = 1500;

type HandleLinkClick = (
  event: React.MouseEvent<HTMLAnchorElement>,
  href: string
) => void;

type UsePageTransitionResult = {
  isTransitioning: boolean;
  handleLinkClick: HandleLinkClick;
  startTransition: (href: string) => void;
};

export function usePageTransition(resetKey: string): UsePageTransitionResult {
  const router = useRouter();
  const pathname = usePathname();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const transitionTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingNavigationRef = React.useRef(false);
  const transitionStartRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      pendingNavigationRef.current = false;
      transitionStartRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (!pendingNavigationRef.current) {
      return;
    }

    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const startedAt = transitionStartRef.current ?? now;
    const elapsed = now - startedAt;
    const remaining = Math.max(0, MIN_VISIBLE_DURATION_MS - elapsed);

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    transitionTimeoutRef.current = setTimeout(() => {
      pendingNavigationRef.current = false;
      transitionTimeoutRef.current = null;
      transitionStartRef.current = null;
      setIsTransitioning(false);
    }, remaining);
  }, [pathname, resetKey]);

  const startTransition = React.useCallback(
    (href: string) => {
      if (prefersReducedMotion) {
        router.push(href);
        return;
      }

      if (isTransitioning) {
        return;
      }

      pendingNavigationRef.current = true;
      transitionStartRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();
      setIsTransitioning(true);
      if (typeof router.prefetch === "function") {
        router.prefetch(href);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      transitionTimeoutRef.current = setTimeout(() => {
        pendingNavigationRef.current = false;
        transitionTimeoutRef.current = null;
        transitionStartRef.current = null;
        setIsTransitioning(false);
      }, FALLBACK_RESET_MS);
      router.push(href);
    },
    [isTransitioning, prefersReducedMotion, router]
  );

  const handleLinkClick = React.useCallback<HandleLinkClick>(
    (event, href) => {
      if (prefersReducedMotion) {
        return;
      }

      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }

      if (isTransitioning) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      startTransition(href);
    },
    [isTransitioning, prefersReducedMotion, startTransition]
  );

  return React.useMemo(
    () => ({
      isTransitioning,
      handleLinkClick,
      startTransition,
    }),
    [handleLinkClick, isTransitioning, startTransition]
  );
}
