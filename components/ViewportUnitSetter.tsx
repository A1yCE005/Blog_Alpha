"use client";

import { useEffect } from "react";

export function ViewportUnitSetter() {
  useEffect(() => {
    const root = document.documentElement;

    const setViewportUnits = () => {
      const vh = window.innerHeight * 0.01;
      root.style.setProperty("--vh", `${vh}px`);
    };

    setViewportUnits();
    window.addEventListener("resize", setViewportUnits);
    window.addEventListener("orientationchange", setViewportUnits);

    return () => {
      window.removeEventListener("resize", setViewportUnits);
      window.removeEventListener("orientationchange", setViewportUnits);
    };
  }, []);

  return null;
}
