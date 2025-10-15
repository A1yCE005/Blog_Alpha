"use client";

import { usePathname } from "next/navigation";
import React from "react";

type PageTransitionProps = {
  children: React.ReactNode;
};

type TransitionStage = "idle" | "exiting" | "entering";

const TRANSITION_DURATION_MS = 500;

const pageVariants = {
  initial: {},
  enter: {},
  exit: {},
} as const;

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  const [stage, setStage] = React.useState<TransitionStage>("idle");
  const [renderedPath, setRenderedPath] = React.useState(pathname);
  const [renderedChildren, setRenderedChildren] = React.useState(children);
  const timeoutRef = React.useRef<number>();
  const latestChildrenRef = React.useRef(children);

  React.useEffect(() => {
    latestChildrenRef.current = children;
    if (pathname === renderedPath) {
      setRenderedChildren(children);
    }
  }, [children, pathname, renderedPath]);

  React.useEffect(() => {
    if (pathname === renderedPath) {
      return;
    }
    setStage("exiting");
  }, [pathname, renderedPath]);

  React.useEffect(() => {
    window.clearTimeout(timeoutRef.current);

    if (stage === "idle") {
      return () => {
        window.clearTimeout(timeoutRef.current);
      };
    }

    timeoutRef.current = window.setTimeout(() => {
      if (stage === "exiting") {
        setRenderedChildren(latestChildrenRef.current);
        setRenderedPath(pathname);
        setStage("entering");
      } else if (stage === "entering") {
        setStage("idle");
      }
    }, TRANSITION_DURATION_MS) as unknown as number;

    return () => {
      window.clearTimeout(timeoutRef.current);
    };
  }, [stage, pathname]);

  React.useEffect(() => {
    return () => {
      window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const overlayOpacityClass = stage === "exiting" ? "opacity-100" : "opacity-0";
  const contentOpacityClass = stage === "exiting" ? "opacity-0" : "opacity-100";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black">
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-black/40 transition-opacity duration-500 ease-out ${overlayOpacityClass}`}
      />

      <div
        className={`relative transition-opacity duration-500 ease-out ${contentOpacityClass}`}
      >
        {renderedChildren}
      </div>
    </div>
  );
}
