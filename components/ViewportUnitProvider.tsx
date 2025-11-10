"use client";

import { useEffect } from "react";

const VIEWPORT_HEIGHT_VAR = "--viewport-height";

export function ViewportUnitProvider() {
  useEffect(() => {
    const root = document.documentElement;

    const setViewportHeight = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      root.style.setProperty(VIEWPORT_HEIGHT_VAR, `${height}px`);
    };

    setViewportHeight();

    window.addEventListener("resize", setViewportHeight);

    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener("resize", setViewportHeight);
    visualViewport?.addEventListener("scroll", setViewportHeight);

    return () => {
      window.removeEventListener("resize", setViewportHeight);
      visualViewport?.removeEventListener("resize", setViewportHeight);
      visualViewport?.removeEventListener("scroll", setViewportHeight);
    };
  }, []);

  return null;
}
