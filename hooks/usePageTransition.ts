"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

export function usePageTransition(): UsePageTransitionResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const transitionTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTransitioningRef = React.useRef(isTransitioning);

  const currentPathname = React.useMemo(() => pathname, [pathname]);
  const searchParamsString = React.useMemo(
    () => searchParams?.toString() ?? "",
    [searchParams]
  );

  React.useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    isTransitioningRef.current = isTransitioning;
  }, [isTransitioning]);

  React.useEffect(() => {
    if (!isTransitioningRef.current) {
      return;
    }

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }

    isTransitioningRef.current = false;
    setIsTransitioning(false);
  }, [currentPathname, searchParamsString]);

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
