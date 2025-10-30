"use client";

import Link from "next/link";

import type { PostSummary } from "@/lib/posts";
import { siteConfig } from "@/lib/site-config";
import { PostCard } from "@/components/PostCard";
import { usePageTransition } from "@/hooks/usePageTransition";

type BlogMainProps = {
  visible: boolean;
  posts: PostSummary[];
};

export function BlogMain({ visible, posts }: BlogMainProps) {
  const { isTransitioning, handleLinkClick } = usePageTransition("home");
  const isInteractive = visible && !isTransitioning;

  return (
    <>
      <div
        aria-hidden
        className={`page-transition-overlay ${isTransitioning ? "page-transition-overlay-active" : ""}`}
      />
      <div
        aria-hidden={!visible}
        className={`fixed inset-0 z-20 overflow-y-auto bg-gradient-to-b from-transparent via-black/60 to-black transition-opacity duration-300 ease-out ${
          visible ? "page-fade-in" : ""
        } ${
          isInteractive ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className={`mx-auto flex min-h-full w-full max-w-4xl flex-col gap-10 px-6 py-16 transition-transform duration-300 ease-out sm:px-10 ${
            isInteractive ? "translate-y-0" : "translate-y-8"
          }`}
        >
          <header className="flex flex-col gap-6 text-left">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-brand/80">The Journal</p>
              <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">{siteConfig.name}</h2>
              <p className="max-w-2xl text-sm text-muted sm:text-base">{siteConfig.description}</p>
            </div>
            <nav className="flex flex-wrap items-center gap-3">
              <Link
                href="/archive"
                onClick={(event) => handleLinkClick(event, "/archive")}
                className="inline-flex items-center rounded-full border border-border/60 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-foreground transition-colors duration-200 hover:border-border hover:text-white focus-visible:border-brand focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand/70"
                tabIndex={isInteractive ? undefined : -1}
              >
                Archive
              </Link>
              <Link
                href="/storm"
                onClick={(event) => handleLinkClick(event, "/storm")}
                className="inline-flex items-center rounded-full border border-border/60 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-foreground transition-colors duration-200 hover:border-border hover:text-white focus-visible:border-brand focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand/70"
                tabIndex={isInteractive ? undefined : -1}
              >
                Storm
              </Link>
              <Link
                href="/about"
                onClick={(event) => handleLinkClick(event, "/about")}
                className="inline-flex items-center rounded-full border border-border/60 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-foreground transition-colors duration-200 hover:border-border hover:text-white focus-visible:border-brand focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand/70"
                tabIndex={isInteractive ? undefined : -1}
              >
                About
              </Link>
            </nav>
          </header>

          {posts.length > 0 ? (
            <div className="flex flex-col gap-6">
              {posts.map((post) => (
                <PostCard
                  key={post.slug}
                  post={post}
                  href={`/posts/${post.slug}`}
                  onClick={(event) => handleLinkClick(event, `/posts/${post.slug}`)}
                  tabIndex={isInteractive ? undefined : -1}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border/60 bg-surface/80 p-12 text-center text-sm text-muted">
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
