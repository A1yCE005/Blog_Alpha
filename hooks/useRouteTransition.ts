"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type UseRouteTransitionOptions = {
  durationMs?: number;
};

type RouteTransitionHandler = (
  event: React.MouseEvent<HTMLAnchorElement>,
  href: string,
  options?: {
    transitionKey?: string;
  }
) => void;

export function useRouteTransition({
  durationMs = 300,
}: UseRouteTransitionOptions = {}): {
  isTransitioning: boolean;
  transitionKey: string | null;
  handleRouteTransition: RouteTransitionHandler;
} {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [transitionKey, setTransitionKey] = React.useState<string | null>(null);
  const transitionTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const handleRouteTransition = React.useCallback<RouteTransitionHandler>(
    (event, href, options) => {
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

      if (transitionTimeoutRef.current) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      setTransitionKey(options?.transitionKey ?? href);
      transitionTimeoutRef.current = setTimeout(() => {
        router.push(href);
        transitionTimeoutRef.current = null;
      }, durationMs);
    },
    [durationMs, prefersReducedMotion, router]
  );

  return {
    isTransitioning: transitionKey !== null,
    transitionKey,
    handleRouteTransition,
  };
}
