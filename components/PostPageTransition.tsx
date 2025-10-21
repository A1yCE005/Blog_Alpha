"use client";

import React from "react";
import Link from "next/link";
import { createPortal } from "react-dom";

import { usePageTransition } from "@/hooks/usePageTransition";

type PostPageTransitionProps = {
  resetKey: string;
  backHref: string;
  rootId: string;
  backLinkSlotId: string;
};

export function PostPageTransition({
  resetKey,
  backHref,
  rootId,
  backLinkSlotId,
}: PostPageTransitionProps) {
  const { isTransitioning, handleLinkClick } = usePageTransition(resetKey);
  const [rootElement, setRootElement] = React.useState<HTMLElement | null>(null);
  const [backLinkSlot, setBackLinkSlot] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    setRootElement(document.getElementById(rootId));
    setBackLinkSlot(document.getElementById(backLinkSlotId));
  }, [backLinkSlotId, rootId]);

  React.useEffect(() => {
    if (!rootElement) {
      return;
    }

    if (isTransitioning) {
      rootElement.dataset.transitionState = "transitioning";
      rootElement.setAttribute("aria-busy", "true");
    } else {
      rootElement.dataset.transitionState = "idle";
      rootElement.removeAttribute("aria-busy");
    }
  }, [isTransitioning, rootElement]);

  React.useEffect(() => {
    return () => {
      if (!rootElement) {
        return;
      }

      rootElement.dataset.transitionState = "idle";
      rootElement.removeAttribute("aria-busy");
    };
  }, [rootElement]);

  const isInteractive = !isTransitioning;

  return (
    <>
      <div
        aria-hidden
        className={`page-transition-overlay ${isTransitioning ? "page-transition-overlay-active" : ""}`}
      />
      {backLinkSlot
        ? createPortal(
            <Link
              href={backHref}
              onClick={(event) => handleLinkClick(event, backHref)}
              className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.35em] text-zinc-500 transition-colors duration-200 hover:text-violet-200 focus-visible:text-violet-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-200/50"
              tabIndex={isInteractive ? undefined : -1}
            >
              <span aria-hidden>←</span> Back to the cloud
            </Link>,
            backLinkSlot
          )
        : null}
    </>
  );
}
