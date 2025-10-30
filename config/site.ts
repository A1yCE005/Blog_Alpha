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
  description: "Midjourney-style letter cloud hero animation",
  themeColor: "#020617",
  features: {
    toc: false,
    codeCopy: true,
    math: true,
  },
  typography: {
    bodyFont: "Inter",
    monoFont: "Fira Code",
  },
};
