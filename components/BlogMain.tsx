"use client";

import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";

import type { PostSummary } from "@/lib/posts";

type BlogMainProps = {
  visible: boolean;
  posts: PostSummary[];
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const TRANSITION_DURATION_MS = 300;

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }

    // Fallback for older browsers that use addListener/removeListener
    if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(listener);
      return () => mediaQuery.removeListener(listener);
    }

    return undefined;
  }, []);

  return prefersReducedMotion;
}

export function BlogMain({ visible, posts }: BlogMainProps) {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [transitioningSlug, setTransitioningSlug] = React.useState<string | null>(null);
  const transitionTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const handlePostClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
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

      if (transitioningSlug) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      setTransitioningSlug(slug);
      transitionTimeoutRef.current = setTimeout(() => {
        router.push(`/posts/${slug}`);
        transitionTimeoutRef.current = null;
      }, TRANSITION_DURATION_MS);
    },
    [prefersReducedMotion, router, transitioningSlug]
  );

  const isInteractive = visible && !transitioningSlug;

  return (
    <>
      <div
        aria-hidden
        className={`page-transition-overlay ${transitioningSlug ? "page-transition-overlay-active" : ""}`}
      />
      <div
        aria-hidden={!visible}
        className={`fixed inset-0 z-20 overflow-y-auto bg-gradient-to-b from-transparent via-black/60 to-black transition-opacity duration-300 ease-out ${
          isInteractive ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className={`mx-auto flex min-h-full w-full max-w-4xl flex-col gap-10 px-6 py-16 transition-transform duration-300 ease-out sm:px-10 ${
            isInteractive ? "translate-y-0" : "translate-y-8"
          }`}
        >
          <header className="flex flex-col gap-3 text-left">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300/80">The Journal</p>
            <h2 className="text-3xl font-semibold text-zinc-50 sm:text-4xl">Lighthosue</h2>
            <p className="max-w-2xl text-sm text-zinc-400 sm:text-base">
              Essays, signals, and experiments from the Letter Cloud studio. Click any post to keep the momentum of the particles going in your own practice.
            </p>
          </header>

          {posts.length > 0 ? (
            <div className="flex flex-col gap-6">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/posts/${post.slug}`}
                  onClick={(event) => handlePostClick(event, post.slug)}
                  tabIndex={isInteractive ? undefined : -1}
                  className="group relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <article className="flex flex-col gap-5 rounded-3xl border border-white/5 bg-gradient-to-b from-zinc-950/90 via-zinc-950/40 to-zinc-950/90 p-6 shadow-[0_30px_80px_-45px_rgba(167,139,250,0.55)] transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:border-violet-400/60 group-hover:shadow-[0_45px_120px_-50px_rgba(167,139,250,0.65)]">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.25em] text-zinc-500">
                      <span>{dateFormatter.format(new Date(post.date))}</span>
                      <span className="font-medium text-violet-300/80">{post.readingTime}</span>
                    </div>

                    <div className="flex flex-col gap-3">
                      <h3 className="text-2xl font-semibold text-zinc-50 transition-colors duration-300 group-hover:text-violet-200">
                        {post.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-zinc-400">
                        {post.excerpt}
                      </p>
                    </div>

                    {post.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/10 px-3 py-1 text-[0.7rem] font-semibold text-zinc-300 transition-colors duration-300 group-hover:border-violet-400/60 group-hover:text-violet-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/10 bg-zinc-950/50 p-12 text-center text-sm text-zinc-400">
              <p>
                No posts found yet. Drop a markdown file into <code>content/posts</code> to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
