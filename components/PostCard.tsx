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

export type PostCardProps = {
  post: PostSummary;
  href: string;
  className?: string;
} & Pick<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "onClick" | "tabIndex" | "aria-hidden" | "aria-label"
>;

export function PostCard({ post, href, className = "", ...linkProps }: PostCardProps) {
  return (
    <Link
      href={href}
      className={`group relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${className}`.trim()}
      {...linkProps}
    >
      <article className="flex h-full flex-col gap-5 rounded-3xl border border-white/5 bg-gradient-to-b from-zinc-950/90 via-zinc-950/40 to-zinc-950/90 p-6 shadow-[0_30px_80px_-45px_rgba(167,139,250,0.55)] transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:border-violet-400/60 group-hover:shadow-[0_45px_120px_-50px_rgba(167,139,250,0.65)]">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.25em] text-zinc-500">
          <span>{dateFormatter.format(new Date(post.date))}</span>
          <span className="font-medium text-violet-300/80">{post.readingTime}</span>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-2xl font-semibold text-zinc-50 transition-colors duration-300 group-hover:text-violet-200">
            {post.title}
          </h3>
          <p className="text-sm leading-relaxed text-zinc-400">{post.excerpt}</p>
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
  );
}
