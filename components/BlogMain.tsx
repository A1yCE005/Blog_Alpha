"use client";

import React from "react";
import { useRouter } from "next/navigation";

import type { PostSummary } from "@/lib/posts";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { PostCard } from "@/components/PostCard";

type BlogMainProps = {
  visible: boolean;
  posts: PostSummary[];
};

const TRANSITION_DURATION_MS = 300;

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
                <PostCard
                  key={post.slug}
                  post={post}
                  href={`/posts/${post.slug}`}
                  onClick={(event) => handlePostClick(event, post.slug)}
                  tabIndex={isInteractive ? undefined : -1}
                />
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
