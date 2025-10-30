import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./content/**/*.{md,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--color-background) / <alpha-value>)",
        foreground: "hsl(var(--color-foreground) / <alpha-value>)",
        muted: "hsl(var(--color-muted) / <alpha-value>)",
        surface: "hsl(var(--color-surface) / <alpha-value>)",
        border: "hsl(var(--color-border) / <alpha-value>)",
        brand: {
          DEFAULT: "hsl(var(--color-brand) / <alpha-value>)",
          foreground: "hsl(var(--color-brand-foreground) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: [
          "var(--typography-body, var(--font-sans))",
          "PingFang SC",
          "Hiragino Sans",
          "Noto Sans CJK SC",
          "Microsoft YaHei",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--typography-mono, var(--font-mono))",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "Noto Sans Mono CJK SC",
          "ui-monospace",
          "monospace",
        ],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      lineHeight: {
        tight: "var(--line-height-tight)",
        snug: "var(--line-height-snug)",
        relaxed: "var(--line-height-relaxed)",
      },
      transitionTimingFunction: {
        standard: "var(--ease-standard)",
        emphasized: "var(--ease-emphasized)",
      },
      transitionDuration: {
        standard: "var(--duration-standard)",
        emphasized: "var(--duration-emphasized)",
      },
    },
  },
  plugins: [typography],
};

export default config;
