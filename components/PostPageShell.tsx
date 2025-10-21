"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { usePageTransition } from "@/hooks/usePageTransition";

type PostPageShellProps = {
  backHref: string;
  resetKey: string;
  children: ReactNode;
};

export function PostPageShell({ backHref, resetKey, children }: PostPageShellProps) {
  const { isTransitioning, handleLinkClick } = usePageTransition(resetKey);
  const isInteractive = !isTransitioning;

  return (
    <>
      <div
        aria-hidden
        className={`page-transition-overlay ${isTransitioning ? "page-transition-overlay-active" : ""}`}
      />
      <div
        className={`relative min-h-screen bg-black page-fade-in transition-opacity duration-300 ease-out ${
          isTransitioning ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="mx-auto w-full max-w-3xl px-6 py-20 sm:px-10">
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
          {children}
        </div>
      </div>
    </>
  );
}
