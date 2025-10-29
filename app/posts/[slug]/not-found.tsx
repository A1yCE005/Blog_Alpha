"use client";

import Link from "next/link";

import { usePageTransition } from "@/hooks/usePageTransition";

const HOME_HREF = "/?view=blog";

export default function PostNotFound() {
  const { isTransitioning, handleLinkClick } = usePageTransition("post:not-found");
  const isInteractive = !isTransitioning;

  return (
    <>
      <div
        aria-hidden
        className={`page-transition-overlay ${isTransitioning ? "page-transition-overlay-active" : ""}`}
      />
      <div
        className={`relative min-h-screen bg-black page-fade-in transition-opacity duration-300 ease-out ${
          isInteractive ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-20 text-center text-zinc-200 sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-violet-300/80">404</p>
          <h1 className="mt-4 text-3xl font-semibold">We lost this story in the storm.</h1>
          <p className="mt-4 max-w-md text-sm text-zinc-400">
            The article you were looking for has drifted out of range. Return to the cloud to browse the latest dispatches.
          </p>
          <Link
            href={HOME_HREF}
            onClick={(event) => handleLinkClick(event, HOME_HREF)}
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-zinc-100 transition-colors duration-200 hover:border-violet-400/60 hover:text-violet-200"
            tabIndex={isInteractive ? undefined : -1}
          >
            <span aria-hidden>←</span> Back to home
          </Link>
        </div>
      </div>
    </>
  );
}
