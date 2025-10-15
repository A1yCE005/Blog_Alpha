"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import React from "react";

type PageTransitionProps = {
  children: React.ReactNode;
};

type TransitionStage = "idle" | "exiting" | "entering";

const OVERLAY_IN_SECONDS = 0.42;
const OVERLAY_OUT_SECONDS = 0.45;
const CONTENT_EXIT_SECONDS = 0.32;
const CONTENT_ENTER_SECONDS = 0.58;

const OVERLAY_COVER_MS = OVERLAY_IN_SECONDS * 1000;
const OVERLAY_REVEAL_MS = OVERLAY_OUT_SECONDS * 1000;
const CONTENT_EXIT_MS = CONTENT_EXIT_SECONDS * 1000;
const CONTENT_ENTER_MS = CONTENT_ENTER_SECONDS * 1000;

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [isBlocking, setIsBlocking] = React.useState(false);
  const [overlayState, setOverlayState] = React.useState<"hidden" | "cover">("hidden");
  const [contentPhase, setContentPhase] = React.useState<"idle" | "enter" | "exit">("idle");
  const [current, setCurrent] = React.useState(() => ({
    key: pathname,
    node: children,
  }));

  const latestChildrenRef = React.useRef(children);
  const coverTimerRef = React.useRef<number | null>(null);
  const settleTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    latestChildrenRef.current = children;
  }, [children]);

  React.useEffect(() => {
    return () => {
      if (coverTimerRef.current) {
        window.clearTimeout(coverTimerRef.current);
      }
      if (settleTimerRef.current) {
        window.clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (shouldReduceMotion) {
      if (coverTimerRef.current) {
        window.clearTimeout(coverTimerRef.current);
        coverTimerRef.current = null;
      }
      if (settleTimerRef.current) {
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
      setOverlayState("hidden");
      setContentPhase("idle");
      setCurrent({ key: pathname, node: latestChildrenRef.current });
      setIsBlocking(false);
      return;
    }

    if (current.key === pathname) {
      setCurrent({ key: pathname, node: latestChildrenRef.current });
      return;
    }

    if (coverTimerRef.current) {
      window.clearTimeout(coverTimerRef.current);
      coverTimerRef.current = null;
    }
    if (settleTimerRef.current) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }

    setIsBlocking(true);
    setOverlayState("cover");
    setContentPhase("exit");

    const delayBeforeSwap = Math.max(OVERLAY_COVER_MS, CONTENT_EXIT_MS);

    coverTimerRef.current = window.setTimeout(() => {
      setCurrent({ key: pathname, node: latestChildrenRef.current });
      setContentPhase("enter");
      setOverlayState("hidden");

      const delayBeforeIdle = Math.max(OVERLAY_REVEAL_MS, CONTENT_ENTER_MS);

      settleTimerRef.current = window.setTimeout(() => {
        setContentPhase("idle");
        setIsBlocking(false);
        settleTimerRef.current = null;
      }, delayBeforeIdle);
    }, delayBeforeSwap);
  }, [pathname, shouldReduceMotion, current.key]);

  const overlayVariants = React.useMemo(
    () => ({
      hidden: { opacity: 0, backdropFilter: "blur(0px)" },
      cover: { opacity: 1, backdropFilter: "blur(20px)" },
    }),
    []
  );

  const overlayTransition = React.useMemo(() => {
    if (shouldReduceMotion) {
      return { duration: 0 };
    }
    return overlayState === "cover"
      ? { duration: OVERLAY_IN_SECONDS, ease: easing }
      : { duration: OVERLAY_OUT_SECONDS, ease: easing };
  }, [overlayState, shouldReduceMotion]);

  const contentVariants = React.useMemo(
    () => ({
      prep: { opacity: 0, y: 48, filter: "blur(12px)" },
      enter: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: CONTENT_ENTER_SECONDS, ease: easing },
      },
      exit: {
        opacity: 0,
        y: -48,
        filter: "blur(12px)",
        transition: { duration: CONTENT_EXIT_SECONDS, ease: easing },
      },
      idle: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0 },
      },
    }),
    []
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black">
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-black/40 transition-opacity duration-500 ease-out ${overlayOpacityClass}`}
      />

      {!shouldReduceMotion && (
        <motion.div
          aria-hidden
          className={`fixed inset-0 z-50 bg-gradient-to-b from-transparent via-transparent to-black/40 ${
            isBlocking ? "pointer-events-auto" : "pointer-events-none"
          }`}
          variants={overlayVariants}
          animate={overlayState}
          initial="hidden"
          transition={overlayTransition}
        />
      )}

      <motion.div
        key={current.key}
        variants={contentVariants}
        initial={shouldReduceMotion ? false : "prep"}
        animate={shouldReduceMotion ? "idle" : contentPhase}
        className="relative"
      >
        {current.node}
      </motion.div>
    </div>
  );
}
