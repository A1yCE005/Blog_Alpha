"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import React from "react";

type PageTransitionProps = {
  children: React.ReactNode;
};

const easing: [number, number, number, number] = [0.22, 1, 0.36, 1];

const OVERLAY_IN_SECONDS = 0.42;
const OVERLAY_OUT_SECONDS = 0.45;
const OVERLAY_HOLD_MS = 120;

const CONTENT_EXIT_SECONDS = 0.32;
const CONTENT_ENTER_SECONDS = 0.58;

const OVERLAY_VISIBLE_MS =
  Math.max(OVERLAY_IN_SECONDS, CONTENT_EXIT_SECONDS) * 1000 + OVERLAY_HOLD_MS;

const overlayVariants = {
  initial: { opacity: 0, backdropFilter: "blur(0px)" },
  animate: {
    opacity: 1,
    backdropFilter: "blur(18px)",
    transition: { duration: OVERLAY_IN_SECONDS, ease: easing },
  },
  exit: {
    opacity: 0,
    backdropFilter: "blur(0px)",
    transition: { duration: OVERLAY_OUT_SECONDS, ease: easing },
  },
};

const contentVariants = {
  initial: { opacity: 0, y: 56, filter: "blur(14px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: CONTENT_ENTER_SECONDS, ease: easing },
  },
  exit: {
    opacity: 0,
    y: -56,
    filter: "blur(14px)",
    transition: { duration: CONTENT_EXIT_SECONDS, ease: easing },
  },
};

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [showOverlay, setShowOverlay] = React.useState(false);
  const overlayTimeoutRef = React.useRef<number | null>(null);
  const isInitialRenderRef = React.useRef(true);

  React.useEffect(() => {
    if (overlayTimeoutRef.current) {
      window.clearTimeout(overlayTimeoutRef.current);
      overlayTimeoutRef.current = null;
    }

    if (shouldReduceMotion) {
      setShowOverlay(false);
      isInitialRenderRef.current = false;
      return;
    }

    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      return;
    }

    setShowOverlay(true);

    overlayTimeoutRef.current = window.setTimeout(() => {
      setShowOverlay(false);
      overlayTimeoutRef.current = null;
    }, OVERLAY_VISIBLE_MS);

    return () => {
      if (overlayTimeoutRef.current) {
        window.clearTimeout(overlayTimeoutRef.current);
        overlayTimeoutRef.current = null;
      }
    };
  }, [pathname, shouldReduceMotion]);

  React.useEffect(() => {
    return () => {
      if (overlayTimeoutRef.current) {
        window.clearTimeout(overlayTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black">
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-black/40 transition-opacity duration-500 ease-out ${overlayOpacityClass}`}
      />

      {!shouldReduceMotion && (
        <AnimatePresence initial={false}>
          {showOverlay && (
            <motion.div
              aria-hidden
              className="pointer-events-auto fixed inset-0 z-50 bg-gradient-to-b from-transparent via-transparent to-black/40"
              variants={overlayVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            />
          )}
        </AnimatePresence>
      )}

      {shouldReduceMotion ? (
        <div className="relative">{children}</div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            className="relative"
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
