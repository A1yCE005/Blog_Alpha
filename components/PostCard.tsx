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
  cardClassName?: string;
  variant?: "list" | "showcase";
} & Pick<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "onClick" | "tabIndex" | "aria-hidden" | "aria-label"
>;

export function PostCard({
  post,
  href,
  className = "",
  cardClassName = "",
  variant = "list",
  ...linkProps
}: PostCardProps) {
  const cardBaseClass =
    variant === "showcase"
      ? "flex h-full flex-col gap-6 rounded-[28px] border border-white/10 bg-gradient-to-br from-zinc-950/70 via-zinc-950/35 to-zinc-950/70 p-7 shadow-[0_40px_140px_-70px_rgba(167,139,250,0.7)] backdrop-blur-sm transition-transform duration-700 ease-out group-hover:-translate-y-1 group-hover:scale-[1.015] group-hover:border-violet-300/60"
      : "flex flex-col gap-5 rounded-3xl border border-white/5 bg-gradient-to-b from-zinc-950/90 via-zinc-950/40 to-zinc-950/90 p-6 shadow-[0_30px_80px_-45px_rgba(167,139,250,0.55)] transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:border-violet-400/60 group-hover:shadow-[0_45px_120px_-50px_rgba(167,139,250,0.65)]";

  const metaClass =
    variant === "showcase"
      ? "flex flex-wrap items-center justify-between gap-3 text-[0.7rem] uppercase tracking-[0.3em] text-zinc-400"
      : "flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.25em] text-zinc-500";

  const readingTimeClass =
    variant === "showcase"
      ? "font-semibold text-violet-200"
      : "font-medium text-violet-300/80";

  const titleClass =
    variant === "showcase"
      ? "text-3xl font-semibold text-zinc-50 transition-colors duration-300 group-hover:text-violet-200"
      : "text-2xl font-semibold text-zinc-50 transition-colors duration-300 group-hover:text-violet-200";

  const excerptClass =
    variant === "showcase"
      ? "text-base leading-relaxed text-zinc-300/90"
      : "text-sm leading-relaxed text-zinc-400";

  const tagsClass =
    variant === "showcase"
      ? "mt-3 flex flex-wrap gap-2 text-[0.7rem] uppercase tracking-[0.28em] text-zinc-400"
      : "mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500";

  const tagPillClass =
    variant === "showcase"
      ? "rounded-full border border-white/10 px-3 py-1 font-semibold text-zinc-200 transition-colors duration-300 group-hover:border-white/40 group-hover:text-white"
      : "rounded-full border border-white/10 px-3 py-1 text-[0.7rem] font-semibold text-zinc-300 transition-colors duration-300 group-hover:border-violet-400/60 group-hover:text-violet-200";

  return (
    <Link
      href={href}
      className={`group relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${className}`.trim()}
      {...linkProps}
    >
      <article className={`${cardBaseClass} ${cardClassName}`.trim()}>
        <div className={metaClass}>
          <span>{dateFormatter.format(new Date(post.date))}</span>
          <span className={readingTimeClass}>{post.readingTime}</span>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className={titleClass}>{post.title}</h3>
          <p className={excerptClass}>{post.excerpt}</p>
        </div>

        {post.tags.length > 0 && (
          <div className={tagsClass}>
            {post.tags.map((tag) => (
              <span
                key={tag}
                className={tagPillClass}
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
