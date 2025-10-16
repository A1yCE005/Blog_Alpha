"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

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

export function BlogMain({ visible, posts }: BlogMainProps) {
  const router = useRouter();
  const [transitionSlug, setTransitionSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!transitionSlug) {
      return;
    }

    const timeout = window.setTimeout(() => {
      router.push(`/posts/${transitionSlug}`);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [router, transitionSlug]);

  const handleNavigation = (
    event: React.MouseEvent<HTMLAnchorElement>,
    slug: string,
  ) => {
    if (transitionSlug) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    setTransitionSlug(slug);
  };

  const isTransitioning = Boolean(transitionSlug);

  return (
    <>
      <AnimatePresence>
        {transitionSlug && (
          <motion.div
            className="fixed inset-0 z-40 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute inset-0 bg-zinc-950/90 backdrop-blur"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
            />
            <motion.div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(167,139,250,0.45),_transparent_65%)]"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        aria-hidden={!visible}
        className={`fixed inset-0 z-20 overflow-y-auto bg-gradient-to-b from-transparent via-black/60 to-black transition-opacity duration-700 ease-out ${
          visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        } ${isTransitioning ? "pointer-events-none" : ""}`}
      >
        <div
          className={`mx-auto flex min-h-full w-full max-w-4xl flex-col gap-10 px-6 py-16 transition-transform duration-700 ease-out sm:px-10 ${
            visible ? "translate-y-0" : "translate-y-8"
          } ${isTransitioning ? "scale-[0.995]" : ""}`}
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
                tabIndex={visible ? undefined : -1}
                onClick={(event) => handleNavigation(event, post.slug)}
                className={`group relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                  isTransitioning ? "pointer-events-none" : ""
                }`}
              >
                <motion.article
                  className="flex flex-col gap-5 rounded-3xl border border-white/5 bg-gradient-to-b from-zinc-950/90 via-zinc-950/40 to-zinc-950/90 p-6 shadow-[0_30px_80px_-45px_rgba(167,139,250,0.55)] transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:border-violet-400/60 group-hover:shadow-[0_45px_120px_-50px_rgba(167,139,250,0.65)]"
                  initial={false}
                  animate={
                    isTransitioning
                      ? transitionSlug === post.slug
                        ? { scale: 1.02, opacity: 1 }
                        : { scale: 0.96, opacity: 0.1 }
                      : { scale: 1, opacity: 1 }
                  }
                  transition={{ duration: 0.45, ease: [0.33, 1, 0.68, 1] }}
                >
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
                </motion.article>
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
