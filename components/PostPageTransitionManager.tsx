"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const TRANSITION_DURATION_MS = 400;

function isModifiedEvent(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

type PostPageTransitionManagerProps = {
  resetKey: string;
  backHref: string;
};

export function PostPageTransitionManager({
  resetKey,
  backHref,
}: PostPageTransitionManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const prefersReducedMotion = usePrefersReducedMotion();
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingNavigationRef = React.useRef(false);

  const clearPendingTransition = React.useCallback(() => {
    if (typeof document === "undefined") {
      return;
    }

    const overlay = document.querySelector<HTMLElement>(
      `[data-transition-overlay="${resetKey}"]`
    );
    const container = document.querySelector<HTMLElement>(
      `[data-transition-container="${resetKey}"]`
    );
    const link = document.querySelector<HTMLAnchorElement>(
      `[data-transition-link="${resetKey}"]`
    );

    overlay?.classList.remove("page-transition-overlay-active");
    container?.classList.remove("pointer-events-none", "opacity-0");
    if (link) {
      link.removeAttribute("aria-disabled");
      if (link.getAttribute("data-transition-tabindex") === "temp") {
        link.removeAttribute("tabindex");
        link.removeAttribute("data-transition-tabindex");
      }
    }

    pendingNavigationRef.current = false;
  }, [resetKey]);

  React.useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const overlay = document.querySelector<HTMLElement>(
      `[data-transition-overlay="${resetKey}"]`
    );
    const container = document.querySelector<HTMLElement>(
      `[data-transition-container="${resetKey}"]`
    );
    const link = document.querySelector<HTMLAnchorElement>(
      `[data-transition-link="${resetKey}"]`
    );

    if (!overlay || !container || !link) {
      return undefined;
    }

    const handleClick = (event: MouseEvent) => {
      if (prefersReducedMotion) {
        return;
      }

      if (event.defaultPrevented || isModifiedEvent(event) || event.button !== 0) {
        return;
      }

      event.preventDefault();

      if (pendingNavigationRef.current) {
        return;
      }

      pendingNavigationRef.current = true;

      overlay.classList.add("page-transition-overlay-active");
      container.classList.add("pointer-events-none", "opacity-0");
      link.setAttribute("aria-disabled", "true");
      if (!link.hasAttribute("tabindex")) {
        link.setAttribute("tabindex", "-1");
        link.setAttribute("data-transition-tabindex", "temp");
      }

      timeoutRef.current = setTimeout(() => {
        router.push(backHref);
        timeoutRef.current = null;
      }, TRANSITION_DURATION_MS);
    };

    link.addEventListener("click", handleClick);

    return () => {
      link.removeEventListener("click", handleClick);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      clearPendingTransition();
    };
  }, [backHref, clearPendingTransition, prefersReducedMotion, resetKey, router]);

  React.useEffect(() => {
    if (!pendingNavigationRef.current) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    clearPendingTransition();
  }, [pathname, clearPendingTransition]);

  return null;
}
