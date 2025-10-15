"use client";

import {
  AnimatePresence,
  motion,
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
    transition: { duration: 0.35, ease: easing },
  },
  cover: {
    opacity: 1,
    backdropFilter: "blur(20px)",
    transition: { duration: 0.35, ease: easing },
  },
} as const;

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-black/40"
      />

      <AnimatePresence mode="wait" initial={false}>
        {!shouldReduceMotion && (
          <motion.div
            key={`overlay-${pathname}`}
            aria-hidden
            className="pointer-events-none fixed inset-0 z-50 bg-gradient-to-b from-transparent via-transparent to-black/40"
            variants={overlayVariants}
            initial="cover"
            animate="hidden"
            exit="cover"
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          variants={shouldReduceMotion ? reducedContentVariants : contentVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          className="relative"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
