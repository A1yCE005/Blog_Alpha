"use client";

import React from "react";
import Link from "next/link";

import { usePageTransition } from "@/hooks/usePageTransition";

type PostPageTransitionProps = {
  resetKey: string;
  backHref: string;
  containerId: string;
};

export function PostPageTransition({ resetKey, backHref, containerId }: PostPageTransitionProps) {
  const { isTransitioning, handleLinkClick } = usePageTransition(resetKey);
  const isInteractive = !isTransitioning;

  React.useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) {
      return;
    }

    if (isTransitioning) {
      container.classList.add("pointer-events-none", "opacity-0");
      container.classList.remove("pointer-events-auto", "opacity-100");
    } else {
      container.classList.remove("pointer-events-none", "opacity-0");
      container.classList.add("pointer-events-auto", "opacity-100");
    }

    return () => {
      if (!container) {
        return;
      }

      container.classList.remove("pointer-events-none", "opacity-0");
      container.classList.add("pointer-events-auto", "opacity-100");
    };
  }, [containerId, isTransitioning]);

  return (
    <>
      <div
        aria-hidden
        className={`page-transition-overlay ${isTransitioning ? "page-transition-overlay-active" : ""}`}
      />
      <Link
        href={backHref}
        onClick={(event) => handleLinkClick(event, backHref)}
        className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.35em] text-zinc-500 transition-colors duration-200 hover:text-violet-200"
        tabIndex={isInteractive ? undefined : -1}
      >
        <span aria-hidden>←</span> Back to the cloud
      </Link>
    </>
  );
}
