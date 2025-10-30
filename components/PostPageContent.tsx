import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { Options as RehypeHighlightOptions } from "rehype-highlight";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import bash from "highlight.js/lib/languages/bash";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";
import typescript from "highlight.js/lib/languages/typescript";

import type { PostContent } from "@/lib/posts";
import { siteConfig } from "@/lib/site-config";
import { Prose } from "@/components/Prose";
import { PostPageTransition } from "./PostPageTransition";

const KATEX_MATHML_TAGS = [
  "annotation",
  "math",
  "menclose",
  "merror",
  "mfrac",
  "mglyph",
  "mi",
  "mn",
  "mo",
  "mover",
  "mpadded",
  "mphantom",
  "mprescripts",
  "mroot",
  "mrow",
  "ms",
  "mscarries",
  "mscarry",
  "msgroup",
  "msline",
  "mstyle",
  "mspace",
  "msqrt",
  "msub",
  "msubsup",
  "msup",
  "mtable",
  "mtd",
  "mtext",
  "mtr",
  "munder",
  "munderover",
  "none",
  "semantics",
];

const SAFE_TOKEN = /^[a-zA-Z0-9_-]+$/;
const SAFE_STYLE = /^[-:;,%0-9a-zA-Z. ()]*$/;

const highlightOptions: RehypeHighlightOptions = {
  detect: false,
  languages: {
    bash,
    shell: bash,
    sh: bash,
    javascript,
    js: javascript,
    jsx: javascript,
    json,
    python,
    py: python,
    typescript,
    ts: typescript,
    tsx: typescript,
  },
};

const markdownSanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "mark",
    "sub",
    ...KATEX_MATHML_TAGS,
  ],
  attributes: {
    ...defaultSchema.attributes,
    annotation: [
      ...(defaultSchema.attributes?.annotation ?? []),
      "encoding",
    ],
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ["className", SAFE_TOKEN],
    ],
    math: [
      ...(defaultSchema.attributes?.math ?? []),
      "display",
      "xmlns",
    ],
    menclose: [
      ...(defaultSchema.attributes?.menclose ?? []),
      "notation",
    ],
    mstyle: [
      ...(defaultSchema.attributes?.mstyle ?? []),
      "displaystyle",
      "mathcolor",
      "scriptlevel",
    ],
    mtable: [
      ...(defaultSchema.attributes?.mtable ?? []),
      "columnalign",
      "columnspacing",
      "rowspacing",
    ],
    mo: [
      ...(defaultSchema.attributes?.mo ?? []),
      "fence",
      "lspace",
      "rspace",
      "stretchy",
    ],
    path: [
      ...(defaultSchema.attributes?.path ?? []),
      "d",
    ],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ["ariaHidden", "true"],
      ["className", SAFE_TOKEN],
      ["style", SAFE_STYLE],
    ],
    svg: [
      ...(defaultSchema.attributes?.svg ?? []),
      "height",
      "preserveAspectRatio",
      "viewBox",
      "width",
      "xmlns",
    ],
  },
};

const markdownComponents: Components = {
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src ?? ""} alt={alt ?? ""} loading="lazy" />
  ),
  code: ({ inline, className, children, ...props }: any) => {
    if (inline) {
      return (
        <code className={className ?? ""} {...props}>
          {children}
        </code>
      );
    }

    return (
      <code className={`text-sm ${className ?? ""}`.trim()} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, className, style, ...props }) => {
    const child = React.Children.only(children) as React.ReactElement<{ className?: string }> | undefined;
    const languageMatch =
      child && typeof child.props.className === "string"
        ? child.props.className.match(/language-([\w-]+)/)
        : null;
    const language = languageMatch?.[1];

    return (
      <pre
        className={`overflow-x-auto rounded-lg border border-border/60 bg-surface px-5 py-5 ${className ?? ""}`.trim()}
        data-language={language}
        style={{ padding: "1.25rem", ...(style ?? {}) }}
        {...props}
      >
        {children}
      </pre>
    );
  },
  hr: () => <hr className="my-12 border-t border-border/60" />,
};

const remarkPlugins = siteConfig.features.math ? [remarkGfm, remarkMath] : [remarkGfm];

const rehypePlugins = siteConfig.features.math
  ? [
      rehypeRaw,
      rehypeKatex,
      [rehypeHighlight, highlightOptions],
      [rehypeSanitize, markdownSanitizeSchema],
    ]
  : [rehypeRaw, [rehypeHighlight, highlightOptions], [rehypeSanitize, markdownSanitizeSchema]];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

type PostPageContentProps = {
  post: PostContent;
  backHref?: string;
};

export function PostPageContent({ post, backHref = "/?view=blog" }: PostPageContentProps) {
  const resetKey = `post:${post.slug}`;

  return (
    <PostPageTransition backHref={backHref} resetKey={resetKey}>
      <div className="flex flex-col gap-5">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand/80">
          {dateFormatter.format(new Date(post.date))}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {post.title}
        </h1>
        <p className="text-sm uppercase tracking-[0.25em] text-muted">{post.readingTime}</p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-muted">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border/60 px-3 py-1 text-[0.7rem] font-semibold text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <Prose as="article" className="mt-12">
        <ReactMarkdown components={markdownComponents} remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
          {post.content}
        </ReactMarkdown>
      </Prose>
    </PostPageTransition>
  );
}
