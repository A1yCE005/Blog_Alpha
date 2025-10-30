export type SiteConfig = {
  name: string;
  description: string;
  themeColor: string;
  features: {
    toc: boolean;
    codeCopy: boolean;
    math: boolean;
  };
  typography: {
    bodyFont: string;
    monoFont: string;
  };
};

export const siteConfig: SiteConfig = {
  name: "Lighthouse",
  description:
    "Essays, signals, and experiments from the Letter Cloud studio. Click any post to keep the momentum of the particles going in your own practice.",
  themeColor: "#05050d",
  features: {
    toc: false,
    codeCopy: false,
    math: true,
  },
  typography: {
    bodyFont: "var(--font-sans)",
    monoFont: "var(--font-mono)",
  },
};
