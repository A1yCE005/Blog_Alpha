"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";

import type { PostSummary } from "@/lib/posts";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export type FeaturedPostCardProps = {
  post: PostSummary;
  href: string;
  className?: string;
} & Pick<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "onClick" | "tabIndex" | "aria-hidden" | "aria-label"
>;

export function FeaturedPostCard({
  post,
  href,
  className = "",
  ...linkProps
}: FeaturedPostCardProps) {
  return (
    <Link
      href={href}
      className={`group relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${className}`.trim()}
      {...linkProps}
    >
      <article className="relative overflow-hidden rounded-[2rem] border border-violet-400/10 bg-gradient-to-br from-violet-500/10 via-zinc-950 to-zinc-950 p-8 shadow-[0_45px_120px_-60px_rgba(167,139,250,0.7)] transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:border-violet-400/60 group-hover:shadow-[0_60px_140px_-65px_rgba(167,139,250,0.8)] sm:p-10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(167,139,250,0.18),_transparent_65%)] opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex max-w-3xl flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-violet-300/80">
              <span className="rounded-full border border-violet-400/40 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.4em] text-violet-100/90">
                Featured
              </span>
              <span className="text-zinc-400">{dateFormatter.format(new Date(post.date))}</span>
              <span className="text-violet-200/80">{post.readingTime}</span>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="text-3xl font-semibold text-zinc-50 transition-colors duration-300 group-hover:text-violet-100 sm:text-4xl">
                {post.title}
              </h3>
              <p className="text-base leading-relaxed text-zinc-300 sm:text-lg">
                {post.excerpt}
              </p>
            </div>
            {post.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-violet-200/70">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-violet-400/40 px-3 py-1 text-[0.7rem] font-semibold text-violet-100/80 transition-colors duration-300 group-hover:border-violet-300/70 group-hover:text-violet-50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <span
            aria-hidden
            className="mt-6 inline-flex shrink-0 items-center justify-center self-start rounded-full border border-violet-400/40 p-4 text-sm font-semibold uppercase tracking-[0.35em] text-violet-200/80 transition-colors duration-300 group-hover:border-violet-200 group-hover:text-violet-50 sm:mt-0"
          >
            Read
          </span>
        </div>
      </article>
    </Link>
  );
}

