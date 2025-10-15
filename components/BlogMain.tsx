"use client";

import React from "react";

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
  const content = posts.length > 0 ? (
    posts.map((post) => (
      <article
        key={post.slug}
        className="group relative flex h-full flex-col gap-6 overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-900/80 via-zinc-900/30 to-zinc-900/80 p-6 transition-transform duration-500 ease-out hover:-translate-y-2 hover:border-violet-400/60 hover:shadow-[0_35px_90px_-30px_rgba(167,139,250,0.45)]"
      >
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-zinc-500">
          <span>{dateFormatter.format(new Date(post.date))}</span>
          <span className="font-medium text-violet-300/80">{post.readingTime}</span>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-xl font-semibold text-zinc-50 transition-colors duration-300 group-hover:text-violet-200">
            {post.title}
          </h3>
          <p className="text-sm leading-relaxed text-zinc-400">
            {post.excerpt}
          </p>
        </div>

        {post.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
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
    ))
  ) : (
    <div className="col-span-full flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/10 bg-zinc-900/60 p-12 text-center text-sm text-zinc-400">
      <p>
        No posts found yet. Drop a markdown file into <code>content/posts</code> to get started.
      </p>
    </div>
  );

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-0 z-20 overflow-y-auto bg-gradient-to-b from-transparent via-black/60 to-black transition-opacity duration-700 ease-out ${
        visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="flex min-h-full items-end justify-center px-4 pb-8 md:items-center">
        <div
          className={`mx-auto flex w-full max-w-5xl flex-col gap-8 overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-950/85 p-6 shadow-[0_40px_120px_-45px_rgba(124,58,237,0.45)] backdrop-blur-2xl transition-transform duration-700 ease-out sm:p-10 ${
            visible ? "translate-y-0" : "translate-y-8"
          }`}
        >
          <header className="flex flex-col gap-3 text-left">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300/80">The Journal</p>
            <h2 className="text-3xl font-semibold text-zinc-50 sm:text-4xl">Stories floating inside the cloud</h2>
            <p className="max-w-2xl text-sm text-zinc-400 sm:text-base">
              Essays, signals, and experiments from the Letter Cloud studio. Click any card to keep the momentum of the particles going in your own practice.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">{content}</div>
        </div>
      </div>
    </div>
  );
}
