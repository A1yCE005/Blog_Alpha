"use client";

import Link from "next/link";

import type { PostSummary } from "@/lib/posts";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

type PostListStaticProps = {
  posts: PostSummary[];
};

export function PostListStatic({ posts }: PostListStaticProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-white/10 bg-zinc-950/50 px-6 py-16 text-center text-sm text-zinc-400">
        <p>
          No posts yet. Drop a markdown file into <code>content/posts</code> to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {posts.map((post) => (
        <article
          key={post.slug}
          className="rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-950/90 via-zinc-950/40 to-zinc-950/90 p-6 text-left shadow-[0_30px_80px_-45px_rgba(167,139,250,0.55)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.25em] text-zinc-500">
            <span>{dateFormatter.format(new Date(post.date))}</span>
            <span className="font-medium text-violet-300/80">{post.readingTime}</span>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <Link
              href={`/posts/${post.slug}`}
              className="text-2xl font-semibold text-zinc-50 transition-colors duration-300 hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              {post.title}
            </Link>
            <p className="text-sm leading-relaxed text-zinc-400">{post.excerpt}</p>
          </div>

          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-[0.7rem] font-semibold text-zinc-300">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
