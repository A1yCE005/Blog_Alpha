"use client";

import Link from "next/link";
import type { MouseEvent } from "react";

import type { PostSummary } from "@/lib/posts";
import { usePageTransition } from "@/hooks/usePageTransition";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

type BlogMainProps = {
  visible: boolean;
  headlinePost: PostSummary | null;
  recentPosts: PostSummary[];
};

type PostLinkProps = {
  href: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  tabIndex?: number;
};

function HeadlinePostCard({ post, href, onClick, tabIndex }: { post: PostSummary } & PostLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      tabIndex={tabIndex}
      className="group relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    >
      <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/15 via-zinc-950/85 to-zinc-950/95 p-8 shadow-[0_40px_120px_-60px_rgba(167,139,250,0.7)] transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:border-violet-400/60 group-hover:shadow-[0_60px_160px_-70px_rgba(167,139,250,0.85)]">
        <div className="pointer-events-none">
          <div className="absolute -top-28 -left-12 h-56 w-56 rounded-full bg-violet-500/25 blur-3xl transition-opacity duration-500 group-hover:opacity-70" />
          <div className="absolute -bottom-32 right-0 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl transition-opacity duration-500 group-hover:opacity-60" />
        </div>
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[0.65rem] uppercase tracking-[0.35em] text-violet-100/80">
            <span>Headline</span>
            <span>{dateFormatter.format(new Date(post.date))}</span>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-3xl font-semibold text-zinc-50 transition-colors duration-300 group-hover:text-violet-100 sm:text-4xl">
              {post.title}
            </h3>
            <p className="text-base leading-relaxed text-zinc-300 sm:text-lg">{post.excerpt}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.25em] text-zinc-300/80">
            <span className="text-violet-200/80">{post.readingTime}</span>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 text-[0.65rem] text-zinc-400">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 px-3 py-1 transition-colors duration-300 group-hover:border-violet-400/60 group-hover:text-violet-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

function RecentPostItem({ post, href, onClick, tabIndex }: { post: PostSummary } & PostLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      tabIndex={tabIndex}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    >
      <article className="flex h-full flex-col gap-4 rounded-2xl border border-white/5 bg-zinc-950/70 p-6 transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:border-violet-400/60 group-hover:bg-zinc-950/90">
        <div className="flex items-center justify-between gap-3 text-[0.6rem] uppercase tracking-[0.35em] text-zinc-500">
          <span>{dateFormatter.format(new Date(post.date))}</span>
          <span className="font-medium text-violet-300/80">{post.readingTime}</span>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-zinc-50 transition-colors duration-300 group-hover:text-violet-200">
            {post.title}
          </h3>
          <p className="text-sm leading-relaxed text-zinc-400">{post.excerpt}</p>
        </div>
        {post.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-2 text-[0.6rem] uppercase tracking-[0.25em] text-zinc-500">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 px-3 py-1 transition-colors duration-300 group-hover:border-violet-400/60 group-hover:text-violet-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </Link>
  );
}

export function BlogMain({ visible, headlinePost, recentPosts }: BlogMainProps) {
  const { isTransitioning, handleLinkClick } = usePageTransition("home");
  const isInteractive = visible && !isTransitioning;
  const hasPosts = Boolean(headlinePost || recentPosts.length > 0);

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
          className={`mx-auto flex min-h-full w-full max-w-4xl flex-col gap-12 px-6 py-16 transition-transform duration-300 ease-out sm:px-10 ${
            isInteractive ? "translate-y-0" : "translate-y-8"
          }`}
        >
          <header className="flex flex-col gap-6 text-left">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300/80">In the Storm</p>
              <h2 className="text-3xl font-semibold text-zinc-50 sm:text-4xl">Lighthouse</h2>
              <p className="max-w-2xl text-sm text-zinc-400 sm:text-base">
                I wait between footsteps, a line approaching an asymptote, close enough to touch meaning, never quite touching.
              </p>
            </div>
            <nav className="flex flex-wrap items-center gap-3">
              <Link
                href="/archive"
                onClick={(event) => handleLinkClick(event, "/archive")}
                className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-zinc-200 transition-colors duration-200 hover:border-white/40 hover:text-white focus-visible:border-white/60 focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60"
                tabIndex={isInteractive ? undefined : -1}
              >
                Archive
              </Link>
              <Link
                href="/storm"
                onClick={(event) => handleLinkClick(event, "/storm")}
                className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-zinc-200 transition-colors duration-200 hover:border-white/40 hover:text-white focus-visible:border-white/60 focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60"
                tabIndex={isInteractive ? undefined : -1}
              >
                Storm
              </Link>
              <Link
                href="/about"
                onClick={(event) => handleLinkClick(event, "/about")}
                className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-zinc-200 transition-colors duration-200 hover:border-white/40 hover:text-white focus-visible:border-white/60 focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60"
                tabIndex={isInteractive ? undefined : -1}
              >
                About
              </Link>
            </nav>
          </header>

          {hasPosts ? (
            <div className="flex flex-col gap-12">
              {headlinePost && (
                <section className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.4em] text-violet-200/80">Headline</h3>
                    <span className="text-xs uppercase tracking-[0.3em] text-zinc-500">Editor&apos;s pick</span>
                  </div>
                  <HeadlinePostCard
                    post={headlinePost}
                    href={`/posts/${headlinePost.slug}`}
                    onClick={(event) => handleLinkClick(event, `/posts/${headlinePost.slug}`)}
                    tabIndex={isInteractive ? undefined : -1}
                  />
                </section>
              )}

              {recentPosts.length > 0 && (
                <section className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.4em] text-zinc-200">Recent</h3>
                    <Link
                      href="/archive"
                      onClick={(event) => handleLinkClick(event, "/archive")}
                      className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-300/80 transition-colors duration-200 hover:text-violet-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300/70"
                      tabIndex={isInteractive ? undefined : -1}
                    >
                      View all
                    </Link>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {recentPosts.map((post) => (
                      <RecentPostItem
                        key={post.slug}
                        post={post}
                        href={`/posts/${post.slug}`}
                        onClick={(event) => handleLinkClick(event, `/posts/${post.slug}`)}
                        tabIndex={isInteractive ? undefined : -1}
                      />
                    ))}
                  </div>
                </section>
              )}
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
