import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./content/**/*.{md,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        brand: {
          50: "var(--color-brand-50)",
          100: "var(--color-brand-100)",
          200: "var(--color-brand-200)",
          300: "var(--color-brand-300)",
          400: "var(--color-brand-400)",
          500: "var(--color-brand-500)",
          600: "var(--color-brand-600)",
          DEFAULT: "var(--color-brand-500)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-mono)", ...defaultTheme.fontFamily.mono],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      lineHeight: {
        snug: "var(--leading-snug)",
        relaxed: "var(--leading-relaxed)",
        loose: "var(--leading-loose)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)",
      },
      transitionTimingFunction: {
        standard: "var(--ease-standard)",
        emphasized: "var(--ease-emphasized)",
      },
      spacing: {
        gutter: "var(--space-gutter)",
        "section-y": "var(--space-section-y)",
      },
      typography: ({ theme }) => ({
        invert: {
          css: {
            "--tw-prose-body": theme("colors.zinc.300"),
            "--tw-prose-headings": theme("colors.zinc.50"),
            "--tw-prose-lead": theme("colors.zinc.400"),
            "--tw-prose-links": "var(--color-brand-300)",
            "--tw-prose-bold": theme("colors.zinc.50"),
            "--tw-prose-counters": theme("colors.zinc.500"),
            "--tw-prose-bullets": theme("colors.zinc.500"),
            "--tw-prose-hr": theme("colors.zinc.800"),
            "--tw-prose-quotes": theme("colors.zinc.100"),
            "--tw-prose-quote-borders": "var(--color-brand-400)",
            "--tw-prose-captions": theme("colors.zinc.500"),
            "--tw-prose-code": "var(--color-brand-200)",
            "--tw-prose-pre-bg": "rgba(9, 9, 11, 0.8)",
            "--tw-prose-pre-border": "rgba(255, 255, 255, 0.08)",
            "--tw-prose-th-borders": "rgba(255, 255, 255, 0.1)",
            "--tw-prose-td-borders": "rgba(255, 255, 255, 0.06)",
            color: "var(--tw-prose-body)",
            maxWidth: "100%",
            a: {
              textDecoration: "none",
              fontWeight: theme("fontWeight.medium"),
              transitionProperty: theme("transitionProperty.colors"),
              transitionDuration: "var(--duration-base)",
              transitionTimingFunction: "var(--ease-standard)",
            },
            "a:hover": {
              color: "var(--color-brand-200)",
            },
            strong: {
              color: "var(--tw-prose-bold)",
            },
            code: {
              fontWeight: theme("fontWeight.medium"),
              borderRadius: "calc(var(--radius-sm) / 1.5)",
              paddingInline: "0.4em",
              paddingBlock: "0.2em",
              backgroundColor: "rgba(39, 39, 42, 0.7)",
            },
            "code::before": {
              content: "";
            },
            "code::after": {
              content: "";
            },
            pre: {
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-prose-pre)",
              border: "1px solid var(--tw-prose-pre-border)",
              boxShadow: "0 20px 45px -35px rgba(167, 139, 250, 0.45)",
            },
            "pre code": {
              fontFamily: "var(--font-mono)",
            },
            blockquote: {
              borderLeftColor: "var(--color-brand-400)",
              fontStyle: "italic",
              fontWeight: theme("fontWeight.medium"),
            },
            img: {
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              backgroundColor: "rgba(24, 24, 27, 0.6)",
            },
            table: {
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            },
            th: {
              textTransform: "uppercase",
              letterSpacing: "0.2em",
            },
          },
        },
      }),
    },
  },
  plugins: [typography],
};

export default config;
