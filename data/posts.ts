export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  tags: string[];
};

export const posts: Post[] = [
  {
    slug: "lighthouse-ai-writer",
    title: "How Lighthouse Learns: Building an Ambient AI Writing Routine",
    excerpt:
      "Behind the scenes of Letter Cloud Blog's ambient writing workflow—combining sensory triggers, low-friction note capture, and weekly synthesis rituals to keep ideas flowing.",
    date: "2024-05-28",
    readingTime: "7 min read",
    tags: ["Workflow", "AI", "Process"],
  },
  {
    slug: "interface-of-air",
    title: "The Interface of Air: Designing Motion That Breathes",
    excerpt:
      "Principles for crafting interfaces that feel weightless yet grounded, inspired by the physics-driven hero of Letter Cloud.",
    date: "2024-05-12",
    readingTime: "6 min read",
    tags: ["Design", "Motion", "Case Study"],
  },
  {
    slug: "sonic-notes",
    title: "Sonic Notes: Curating the Weekly Signal",
    excerpt:
      "A recurring column on the three tracks powering focus, flow, and reflection across the studio floor this week.",
    date: "2024-04-30",
    readingTime: "4 min read",
    tags: ["Playlist", "Journal"],
  },
  {
    slug: "field-report",
    title: "Field Report: Reshaping the Coastal Stack",
    excerpt:
      "Notes from a month of remote prototyping along the coast—gear that survived the salt spray and the experiments that didn't.",
    date: "2024-04-08",
    readingTime: "8 min read",
    tags: ["Field Notes", "Hardware"],
  },
];
