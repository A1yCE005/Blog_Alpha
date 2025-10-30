import type { ReactNode } from "react";

export type ProseProps = {
  children: ReactNode;
  className?: string;
};

export function Prose({ children, className }: ProseProps) {
  const classes = ["prose prose-invert max-w-none", className].filter(Boolean).join(" ");

  return <article className={classes}>{children}</article>;
}
