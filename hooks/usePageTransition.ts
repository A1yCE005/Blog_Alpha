"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const TRANSITION_DURATION_MS = 300;

type HandleLinkClick = (
  event: React.MouseEvent<HTMLAnchorElement>,
  href: string
) => void;

type UsePageTransitionResult = {
  isTransitioning: boolean;
  handleLinkClick: HandleLinkClick;
};

export function usePageTransition(resetKey: string): UsePageTransitionResult {
  const router = useRouter();
  const pathname = usePathname();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const transitionTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingNavigationRef = React.useRef(false);

  React.useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      pendingNavigationRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (!pendingNavigationRef.current) {
      return;
    }

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }

    pendingNavigationRef.current = false;
    setIsTransitioning(false);
  }, [pathname, resetKey]);

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
      pendingNavigationRef.current = true;
      setIsTransitioning(true);
      transitionTimeoutRef.current = setTimeout(() => {
        router.push(href);
        transitionTimeoutRef.current = null;
      }, TRANSITION_DURATION_MS);
    },
    [prefersReducedMotion, isTransitioning, router]
  );

  return React.useMemo(
    () => ({
      isTransitioning,
      handleLinkClick,
    }),
    [handleLinkClick, isTransitioning]
  );
}
