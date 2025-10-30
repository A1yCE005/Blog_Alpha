import type { HTMLAttributes } from "react";

type ProseProps = HTMLAttributes<HTMLElement>;

export function Prose({ className, ...props }: ProseProps) {
  const mergedClassName = ["prose prose-invert max-w-none", className]
    .filter(Boolean)
    .join(" ");

  return <article className={mergedClassName} {...props} />;
}
