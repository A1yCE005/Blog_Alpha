import type { HTMLAttributes } from "react";

type ProseProps = HTMLAttributes<HTMLElement> & {
  as?: keyof JSX.IntrinsicElements;
};

const BASE_PROSE_CLASSES = [
  "prose",
  "prose-invert",
  "max-w-none",
  "prose-headings:font-semibold",
  "prose-headings:tracking-tight",
  "prose-headings:text-foreground",
  "prose-p:text-foreground/80",
  "prose-strong:text-foreground",
  "prose-code:font-mono",
  "prose-code:text-brand",
  "prose-pre:bg-zinc-950/60",
  "prose-pre:text-sm",
  "prose-pre:rounded-3xl",
  "prose-hr:border-white/10",
  "prose-img:rounded-3xl",
  "prose-img:border",
  "prose-img:border-white/10",
  "prose-figcaption:text-xs",
  "prose-blockquote:border-brand/50",
  "prose-blockquote:text-foreground/80",
];

export function Prose({ as: Component = "article", className, children, ...props }: ProseProps) {
  const baseClassName = BASE_PROSE_CLASSES.join(" ");
  const mergedClassName = className ? `${baseClassName} ${className}` : baseClassName;
  return (
    <Component className={mergedClassName} {...props}>
      {children}
    </Component>
  );
}
