"use client";

import {
  motion,
  useAnimationControls,
  useReducedMotion,
} from "framer-motion";
import { usePathname } from "next/navigation";
import React from "react";

type PageTransitionProps = {
  children: React.ReactNode;
};

const easing = [0.22, 1, 0.36, 1];

const contentVariants = {
  enter: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: easing },
  },
  exit: {
    opacity: 0,
    y: -32,
    filter: "blur(12px)",
    transition: { duration: 0.45, ease: easing },
  },
};

const reducedContentVariants = {
  enter: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const overlayVariants = {
  hidden: {
    opacity: 0,
    backdropFilter: "blur(0px)",
    transition: { duration: 0.45, ease: easing },
  },
  cover: {
    opacity: 1,
    backdropFilter: "blur(20px)",
    transition: { duration: 0.35, ease: easing },
  },
};

const reducedOverlayVariants = {
  hidden: { opacity: 0, transition: { duration: 0.2 } },
  cover: { opacity: 1, transition: { duration: 0.2 } },
};

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const showOverlay = !shouldReduceMotion;
  const [displayedChildren, setDisplayedChildren] = React.useState(children);
  const [displayedPathname, setDisplayedPathname] = React.useState(pathname);
  const contentControls = useAnimationControls();
  const overlayControls = useAnimationControls();
  const latestChildren = React.useRef(children);

  React.useEffect(() => {
    contentControls.set("enter");
    overlayControls.set("hidden");
  }, [contentControls, overlayControls]);

  React.useEffect(() => {
    latestChildren.current = children;

    if (pathname === displayedPathname) {
      setDisplayedChildren(children);
    }
  }, [children, displayedPathname, pathname]);

  React.useEffect(() => {
    if (pathname === displayedPathname) {
      return;
    }

    let isCancelled = false;

    const runTransition = async () => {
      if (!showOverlay) {
        overlayControls.set("hidden");
      }

      await Promise.all([
        contentControls.start("exit"),
        showOverlay ? overlayControls.start("cover") : Promise.resolve(),
      ]);

      if (isCancelled) {
        return;
      }

      setDisplayedChildren(latestChildren.current);
      setDisplayedPathname(pathname);

      await Promise.all([
        showOverlay ? overlayControls.start("hidden") : Promise.resolve(),
        contentControls.start("enter"),
      ]);
    };

    runTransition();

    return () => {
      isCancelled = true;
    };
  }, [
    contentControls,
    displayedPathname,
    overlayControls,
    pathname,
    shouldReduceMotion,
    showOverlay,
  ]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-black/40"
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50 bg-gradient-to-b from-transparent via-transparent to-black/40"
        variants={shouldReduceMotion ? reducedOverlayVariants : overlayVariants}
        initial="hidden"
        animate={overlayControls}
      />
      <motion.div
        variants={shouldReduceMotion ? reducedContentVariants : contentVariants}
        initial="enter"
        animate={contentControls}
        className="relative"
      >
        {displayedChildren}
      </motion.div>
    </div>
  );
}
