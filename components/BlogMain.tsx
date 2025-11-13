"use client";

import Link from "next/link";

import type { PostSummary } from "@/lib/posts";
import { usePageTransition } from "@/hooks/usePageTransition";

type BlogMainProps = {
  visible: boolean;
  posts: PostSummary[];
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function BlogMain({ visible, posts }: BlogMainProps) {
  const { isTransitioning, handleLinkClick } = usePageTransition("home");
  const isInteractive = visible && !isTransitioning;
  const [headlinePost, ...restPosts] = posts;
  const recentPosts = restPosts.slice(0, 5);

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

          {headlinePost ? (
            <div className="flex flex-col gap-12">
              <section aria-labelledby="headline-post">
                <Link
                  href={`/posts/${headlinePost.slug}`}
                  onClick={(event) => handleLinkClick(event, `/posts/${headlinePost.slug}`)}
                  className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  tabIndex={isInteractive ? undefined : -1}
                >
                  <article className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-gradient-to-br from-zinc-950/90 via-zinc-950/60 to-zinc-950/90 p-8 shadow-[0_45px_120px_-60px_rgba(167,139,250,0.65)] transition-transform duration-500 ease-out hover:-translate-y-1 hover:border-violet-400/60 hover:shadow-[0_60px_150px_-70px_rgba(167,139,250,0.75)] sm:p-10">
                    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-violet-500/10 via-violet-400/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="flex flex-col gap-4">
                      <p
                        id="headline-post"
                        className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-300/90"
                      >
                        Headline
                      </p>
                      <h3 className="text-3xl font-semibold leading-snug text-zinc-50 transition-colors duration-300 group-hover:text-violet-100 sm:text-4xl">
                        {headlinePost.title}
                      </h3>
                      <p className="text-base leading-relaxed text-zinc-300 sm:text-lg">
                        {headlinePost.excerpt}
                      </p>
                    </div>
                    <div className="mt-8 flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.25em] text-zinc-400">
                      <span>{dateFormatter.format(new Date(headlinePost.date))}</span>
                      <span className="font-medium text-violet-300/80">{headlinePost.readingTime}</span>
                      {headlinePost.tags.length > 0 && (
                        <span className="flex flex-wrap gap-2 text-[0.7rem] normal-case tracking-[0.2em] text-zinc-400">
                          {headlinePost.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-300 transition-colors duration-300 group-hover:border-violet-400/60 group-hover:text-violet-200"
                            >
                              {tag}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </article>
                </Link>
              </section>

              {recentPosts.length > 0 && (
                <section className="flex flex-col gap-5" aria-labelledby="recent-posts">
                  <div className="flex flex-col gap-2">
                    <p
                      id="recent-posts"
                      className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-300/90"
                    >
                      Recent
                    </p>
                    <p className="text-sm text-zinc-400">
                      The newest signals from the studio, collected in a tighter cadence than the archive.
                    </p>
                  </div>
                  <ul className="grid gap-4 sm:grid-cols-2">
                    {recentPosts.map((post) => (
                      <li key={post.slug} className="list-none">
                        <Link
                          href={`/posts/${post.slug}`}
                          onClick={(event) => handleLinkClick(event, `/posts/${post.slug}`)}
                          className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                          tabIndex={isInteractive ? undefined : -1}
                        >
                          <article className="flex h-full flex-col justify-between gap-4 rounded-3xl border border-white/5 bg-zinc-950/50 p-6 transition-transform duration-300 ease-out hover:-translate-y-1 hover:border-violet-400/60 hover:bg-zinc-900/60">
                            <div className="flex flex-col gap-3">
                              <div className="flex flex-wrap items-center justify-between gap-3 text-[0.7rem] uppercase tracking-[0.3em] text-zinc-500">
                                <span>{dateFormatter.format(new Date(post.date))}</span>
                                <span className="font-medium text-violet-300/80">{post.readingTime}</span>
                              </div>
                              <h4 className="text-xl font-semibold text-zinc-100 transition-colors duration-300 group-hover:text-violet-200">
                                {post.title}
                              </h4>
                              <p className="text-sm leading-relaxed text-zinc-400">{post.excerpt}</p>
                            </div>
                            {post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.25em] text-zinc-500">
                                {post.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full border border-white/10 px-2 py-1 transition-colors duration-300 group-hover:border-violet-400/60 group-hover:text-violet-200"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </article>
                        </Link>
                      </li>
                    ))}
                  </ul>
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
