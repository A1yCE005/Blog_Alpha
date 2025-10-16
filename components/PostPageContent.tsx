"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";

import type { PostContent } from "@/lib/posts";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-4xl font-semibold tracking-tight text-zinc-100 sm:text-5xl">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-12 text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 text-2xl font-semibold tracking-tight text-zinc-100">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="leading-relaxed text-zinc-300">{children}</p>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      className="font-medium text-violet-300 underline decoration-violet-300/60 underline-offset-4 transition-colors duration-200 hover:text-violet-200"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc space-y-3 pl-6 text-zinc-300">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal space-y-3 pl-6 text-zinc-300">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-violet-400/40 pl-4 text-lg italic text-zinc-200">{children}</blockquote>
  ),
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src ?? ""}
      alt={alt ?? ""}
      className="mx-auto my-8 w-full max-w-3xl rounded-2xl border border-white/10 bg-zinc-900/40 object-contain"
      loading="lazy"
    />
  ),
  table: ({ children }) => (
    <div className="my-8 overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full border-collapse text-left text-sm text-zinc-200">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="bg-white/5 px-4 py-3 font-semibold uppercase tracking-[0.2em] text-zinc-100">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-4 py-3 text-zinc-300">{children}</td>,
  code: ({ inline, className, children, ...props }: any) => {
    if (inline) {
      return (
        <code className="rounded bg-zinc-800/70 px-1.5 py-1 text-sm text-violet-200" {...props}>
          {children}
        </code>
      );
    }

    return (
      <code className={`text-sm ${className ?? ""}`} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => {
    const child = React.Children.only(children) as React.ReactElement<{ className?: string }> | undefined;
    const languageMatch =
      child && typeof child.props.className === "string"
        ? child.props.className.match(/language-([\w-]+)/)
        : null;
    const language = languageMatch?.[1];

    return (
      <pre
        className="overflow-x-auto rounded-2xl bg-zinc-900/80 px-5 py-5"
        data-language={language}
        {...props}
      >
        {children}
      </pre>
    );
  },
  hr: () => <hr className="my-12 border-t border-white/10" />,
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const TRANSITION_DURATION_MS = 300;

type PostPageContentProps = {
  post: PostContent;
};

export function PostPageContent({ post }: PostPageContentProps) {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const transitionTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const handleBackClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (prefersReducedMotion) {
        return;
      }

      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }

      if (isTransitioning) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      setIsTransitioning(true);
      transitionTimeoutRef.current = setTimeout(() => {
        router.push("/?view=blog");
        transitionTimeoutRef.current = null;
      }, TRANSITION_DURATION_MS);
    },
    [prefersReducedMotion, isTransitioning, router]
  );

  return (
    <>
      <div
        aria-hidden
        className={`page-transition-overlay ${isTransitioning ? "page-transition-overlay-active" : ""}`}
      />
      <div
        className={`relative min-h-screen bg-black page-fade-in transition-opacity duration-300 ease-out ${
          isTransitioning ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="mx-auto w-full max-w-3xl px-6 py-20 sm:px-10">
          <div className="mb-10">
            <Link
              href={{ pathname: "/", query: { view: "blog" } }}
              onClick={handleBackClick}
              className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.35em] text-zinc-500 transition-colors duration-200 hover:text-violet-200"
            >
              <span aria-hidden>←</span> Back to the cloud
            </Link>
          </div>
          <div className="flex flex-col gap-5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-300/80">
              {dateFormatter.format(new Date(post.date))}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
              {post.title}
            </h1>
            <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">{post.readingTime}</p>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 px-3 py-1 text-[0.7rem] font-semibold text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <article className="mt-12 flex flex-col gap-6 text-base text-zinc-200">
            <ReactMarkdown
              components={markdownComponents}
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeHighlight]}
            >
              {post.content}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </>
  );
}
