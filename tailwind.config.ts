import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import typography from "@tailwindcss/typography";

const proseBaseStyles = {
  color: "hsl(var(--foreground) / 0.85)",
  maxWidth: "none",
  lineHeight: "var(--leading-relaxed)",
  a: {
    color: "hsl(var(--brand))",
    fontWeight: "500",
    textDecoration: "underline",
    textDecorationColor: "hsl(var(--brand) / 0.4)",
    textUnderlineOffset: "6px",
    transition: "color var(--duration-short) var(--ease-standard)",
  },
  "a:hover": {
    color: "hsl(var(--brand))",
    textDecorationColor: "hsl(var(--brand))",
  },
  strong: {
    color: "hsl(var(--foreground))",
  },
  code: {
    color: "hsl(var(--brand))",
    backgroundColor: "hsl(var(--background) / 0.4)",
    padding: "0.125rem 0.375rem",
    borderRadius: "0.5rem",
    fontWeight: "400",
  },
  "code::before": { display: "none" },
  "code::after": { display: "none" },
  pre: {
    backgroundColor: "hsl(var(--background) / 0.65)",
    color: "hsl(var(--foreground) / 0.9)",
    borderRadius: "var(--radius-lg)",
    padding: "1.25rem",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  blockquote: {
    borderLeftColor: "hsl(var(--brand) / 0.45)",
    color: "hsl(var(--foreground) / 0.8)",
    fontStyle: "italic",
  },
  hr: {
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  "h1, h2, h3, h4": {
    color: "hsl(var(--foreground))",
    lineHeight: "var(--leading-tight)",
    letterSpacing: "-0.01em",
  },
  h1: {
    fontSize: defaultTheme.fontSize["4xl"][0],
  },
  h2: {
    marginTop: "2.5rem",
  },
  h3: {
    marginTop: "2rem",
  },
  h4: {
    marginTop: "1.5rem",
  },
  img: {
    borderRadius: "var(--radius-lg)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  ul: {
    paddingLeft: "1.25rem",
  },
  ol: {
    paddingLeft: "1.25rem",
  },
  li: {
    paddingLeft: "0.25rem",
  },
  table: {
    borderCollapse: "separate",
    borderSpacing: "0",
  },
  thead: {
    borderBottomColor: "rgba(255, 255, 255, 0.12)",
  },
  th: {
    color: "hsl(var(--foreground))",
    fontWeight: "600",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
  },
  td: {
    color: "hsl(var(--foreground) / 0.8)",
  },
};

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./content/**/*.{md,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: "hsl(var(--brand) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-family-sans)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-family-mono)", ...defaultTheme.fontFamily.mono],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      lineHeight: {
        tighter: "var(--leading-tight)",
        relaxed: "var(--leading-relaxed)",
      },
      transitionTimingFunction: {
        brand: "var(--ease-standard)",
        emphasized: "var(--ease-emphasized)",
      },
      transitionDuration: {
        short: "var(--duration-short)",
        medium: "var(--duration-medium)",
        long: "var(--duration-long)",
      },
      spacing: {
        prose: "var(--space-10)",
      },
      typography: () => ({
        DEFAULT: { css: proseBaseStyles },
        invert: { css: proseBaseStyles },
      }),
    },
  },
  plugins: [typography],
};

export default config;
