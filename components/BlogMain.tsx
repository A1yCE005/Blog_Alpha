import React from "react";

import { posts } from "@/data/posts";

type BlogMainProps = {
  visible: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function BlogMain({ visible }: BlogMainProps) {
  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-0 z-20 flex items-end justify-center bg-gradient-to-b from-transparent via-black/60 to-black px-4 pb-8 transition-all duration-700 ease-out md:items-center ${
        visible ? "opacity-100 translate-y-0 pointer-events-auto" : "pointer-events-none opacity-0 translate-y-8"
      }`}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-950/85 p-6 shadow-[0_40px_120px_-45px_rgba(124,58,237,0.45)] backdrop-blur-2xl sm:p-10">
        <header className="flex flex-col gap-3 text-left">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300/80">The Journal</p>
          <h2 className="text-3xl font-semibold text-zinc-50 sm:text-4xl">Stories floating inside the cloud</h2>
          <p className="max-w-2xl text-sm text-zinc-400 sm:text-base">
            Essays, signals, and experiments from the Letter Cloud studio. Click any card to keep the momentum of the particles going in your own practice.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          {posts.map((post) => (
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
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
