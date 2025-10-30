export type SiteFeatures = {
  toc: boolean;
  codeCopy: boolean;
  math: boolean;
};

export type SiteTypography = {
  bodyFont: string;
  monoFont: string;
};

export const siteConfig = {
  name: "Lighthosue",
  description: "Midjourney-style letter cloud hero animation",
  themeColor: "#05040a",
  features: {
    toc: false,
    codeCopy: false,
    math: true,
  } satisfies SiteFeatures,
  typography: {
    bodyFont: "Manrope",
    monoFont: "JetBrains Mono",
  } satisfies SiteTypography,
} as const;

export type SiteConfig = typeof siteConfig;
