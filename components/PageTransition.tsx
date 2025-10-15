"use client";

import {
  AnimatePresence,
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
  initial: {
    opacity: 0,
    y: 48,
    filter: "blur(12px)",
  },
  enter: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: easing },
  },
  exit: {
    opacity: 0,
    y: -48,
    filter: "blur(12px)",
    transition: { duration: 0.45, ease: easing },
  },
} as const;

const reducedContentVariants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
} as const;

const overlayVariants = {
  hidden: {
    opacity: 0,
    backdropFilter: "blur(0px)",
    transition: { duration: 0.4, ease: easing },
  },
  cover: {
    opacity: 1,
    backdropFilter: "blur(20px)",
    transition: { duration: 0.4, ease: easing },
  },
} as const;

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const overlayControls = useAnimationControls();
  const [isBlocking, setIsBlocking] = React.useState(false);
  const [current, setCurrent] = React.useState(() => ({
    key: pathname,
    node: children,
  }));
  const latestChildrenRef = React.useRef(children);
  const previousPathRef = React.useRef(pathname);

  React.useEffect(() => {
    latestChildrenRef.current = children;
  }, [children]);

  React.useEffect(() => {
    overlayControls.set("hidden");
  }, [overlayControls]);

  React.useEffect(() => {
    let cancelled = false;

    const updateImmediately = () => {
      setCurrent({ key: pathname, node: latestChildrenRef.current });
      previousPathRef.current = pathname;
      setIsBlocking(false);
    };

    if (shouldReduceMotion) {
      updateImmediately();
      return () => {
        cancelled = true;
      };
    }

    if (previousPathRef.current === pathname) {
      updateImmediately();
      return () => {
        cancelled = true;
      };
    }

    setIsBlocking(true);

    overlayControls
      .start("cover")
      .then(() => {
        if (cancelled) return;
        setCurrent({ key: pathname, node: latestChildrenRef.current });
        previousPathRef.current = pathname;
        return overlayControls.start("hidden");
      })
      .then(() => {
        if (cancelled) return;
        setIsBlocking(false);
      })
      .catch(() => {
        if (cancelled) return;
        setIsBlocking(false);
      });

    return () => {
      cancelled = true;
      overlayControls.stop();
      setIsBlocking(false);
    };
  }, [pathname, overlayControls, shouldReduceMotion]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-black/40"
      />

      {!shouldReduceMotion && (
        <motion.div
          aria-hidden
          className={`fixed inset-0 z-50 bg-gradient-to-b from-transparent via-transparent to-black/40 ${
            isBlocking ? "pointer-events-auto" : "pointer-events-none"
          }`}
          variants={overlayVariants}
          initial="hidden"
          animate={overlayControls}
        />
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current.key}
          variants={shouldReduceMotion ? reducedContentVariants : contentVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          className="relative"
        >
          {current.node}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
