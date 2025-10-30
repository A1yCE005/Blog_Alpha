import { createElement, type ComponentPropsWithoutRef, type ElementType } from "react";

type ProseProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

export function Prose<T extends ElementType = "div">({
  as,
  className,
  ...props
}: ProseProps<T>) {
  const component = (as ?? "div") as ElementType;
  const mergedClassName = ["prose prose-invert max-w-none", className]
    .filter(Boolean)
    .join(" ");

  return createElement(component, {
    className: mergedClassName,
    ...(props as ComponentPropsWithoutRef<ElementType>),
  });
}
