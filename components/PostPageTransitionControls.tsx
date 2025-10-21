"use client";

import React from "react";
import Link from "next/link";

import { usePageTransition } from "@/hooks/usePageTransition";

type PostPageTransitionControlsProps = {
  backHref: string;
  resetKey: string;
  containerId: string;
};

export function PostPageTransitionControls({
  backHref,
  resetKey,
  containerId,
}: PostPageTransitionControlsProps) {
  const { isTransitioning, handleLinkClick } = usePageTransition(resetKey);
  const isInteractive = !isTransitioning;

  React.useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) {
      return;
    }

    container.setAttribute("data-transitioning", isTransitioning ? "true" : "false");
    return () => {
      container.removeAttribute("data-transitioning");
    };
  }, [containerId, isTransitioning]);

  return (
    <>
      <div
        aria-hidden
        className={`page-transition-overlay ${isTransitioning ? "page-transition-overlay-active" : ""}`}
      />
      <div className="mb-10">
        <Link
          href={backHref}
          onClick={(event) => handleLinkClick(event, backHref)}
          className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.35em] text-zinc-500 transition-colors duration-200 hover:text-violet-200"
          tabIndex={isInteractive ? undefined : -1}
        >
          <span aria-hidden>←</span> Back to the cloud
        </Link>
      </div>
    </>
  );
}
