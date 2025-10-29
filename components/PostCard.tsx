"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, CSSProperties } from "react";

import type { PostSummary } from "@/lib/posts";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export type PostCardVariant = "default" | "floating";
export type PostCardSize = "sm" | "md" | "lg";

const VARIANT_STYLES: Record<
  PostCardVariant,
  {
    container: string;
    meta: string;
    title: string;
    excerpt: string;
    tag: string;
  }
> = {
  default: {
    container:
      "flex flex-col rounded-3xl border border-white/5 bg-gradient-to-b from-zinc-950/90 via-zinc-950/40 to-zinc-950/90 shadow-[0_30px_80px_-45px_rgba(167,139,250,0.55)] transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:border-violet-400/60 group-hover:shadow-[0_45px_120px_-50px_rgba(167,139,250,0.65)]",
    meta: "flex flex-wrap items-center justify-between gap-3 uppercase tracking-[0.25em] text-zinc-500",
    title: "font-semibold text-zinc-50 transition-colors duration-300 group-hover:text-violet-200",
    excerpt: "leading-relaxed text-zinc-400",
    tag: "rounded-full border border-white/10 font-semibold text-zinc-300 transition-colors duration-300 group-hover:border-violet-400/60 group-hover:text-violet-200"
  },
  floating: {
    container:
      "flex flex-col rounded-3xl border border-white/10 bg-[linear-gradient(165deg,rgba(9,11,28,0.92)_0%,rgba(21,17,46,0.78)_45%,rgba(4,6,15,0.95)_100%)] shadow-[0_40px_140px_-70px_rgba(120,90,240,0.65)] backdrop-blur-sm transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:scale-[1.015] group-hover:border-violet-400/60 group-hover:shadow-[0_60px_160px_-70px_rgba(161,128,255,0.7)]",
    meta: "flex flex-wrap items-center justify-between gap-2 uppercase tracking-[0.3em] text-zinc-500/90",
    title: "font-semibold text-zinc-50 transition-colors duration-300 group-hover:text-violet-200",
    excerpt: "leading-relaxed text-zinc-300/90",
    tag: "rounded-full border border-white/10 font-semibold text-zinc-200/90 transition-colors duration-300 group-hover:border-violet-400/60 group-hover:text-violet-200"
  }
};

const SIZE_STYLES: Record<
  PostCardSize,
  {
    container: string;
    meta: string;
    title: string;
    excerpt: string;
    tag: string;
  }
> = {
  sm: {
    container: "gap-4 p-5",
    meta: "text-[0.6rem]",
    title: "text-xl",
    excerpt: "text-sm",
    tag: "text-[0.6rem] px-2.5 py-1"
  },
  md: {
    container: "gap-5 p-6",
    meta: "text-[0.65rem]",
    title: "text-2xl",
    excerpt: "text-sm",
    tag: "text-[0.65rem] px-3 py-1"
  },
  lg: {
    container: "gap-6 p-7",
    meta: "text-[0.72rem]",
    title: "text-[1.75rem] leading-tight",
    excerpt: "text-base",
    tag: "text-[0.7rem] px-3.5 py-1.5"
  }
};

export type PostCardProps = {
  post: PostSummary;
  href: string;
  className?: string;
  style?: CSSProperties;
  variant?: PostCardVariant;
  size?: PostCardSize;
} & Pick<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "onClick" | "tabIndex" | "aria-hidden" | "aria-label"
>;

export function PostCard({
  post,
  href,
  className = "",
  style,
  variant = "default",
  size = "md",
  ...linkProps
}: PostCardProps) {
  const variantStyles = VARIANT_STYLES[variant];
  const sizeStyles = SIZE_STYLES[size];
  const containerClass = `${variantStyles.container} ${sizeStyles.container}`.trim();
  const metaClass = `${variantStyles.meta} ${sizeStyles.meta}`.trim();
  const titleClass = `${variantStyles.title} ${sizeStyles.title}`.trim();
  const excerptClass = `${variantStyles.excerpt} ${sizeStyles.excerpt}`.trim();
  const tagClass = `${variantStyles.tag} ${sizeStyles.tag}`.trim();

  return (
    <Link
      href={href}
      className={`group relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${className}`.trim()}
      style={style}
      {...linkProps}
    >
      <article className={containerClass}>
        <div className={metaClass}>
          <span>{dateFormatter.format(new Date(post.date))}</span>
          <span className="font-medium text-violet-300/80">{post.readingTime}</span>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className={titleClass}>{post.title}</h3>
          <p className={excerptClass}>{post.excerpt}</p>
        </div>

        {post.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
            {post.tags.map((tag) => (
              <span key={tag} className={tagClass}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </Link>
  );
}
