# Lighthouse Letter Cloud Blog

A Next.js 14 blog theme with a Midjourney-inspired letter-cloud hero. Particle
animation, cinematic transitions, and markdown-first authoring are bundled into
one project so you can drop in content and deploy a polished studio journal.

## Highlights

- **Letter Cloud hero** – Animated word particles that respond to pointer
  movement and cycle through idle states. Tuning knobs live in
  [`components/LetterCloud.tsx`](components/LetterCloud.tsx) (`CONFIG`).
- **Blog-first UX** – Surface the five most recent posts on the home view, slide
  into a full archive with pagination, and render detail pages with a custom
  transition.
- **Markdown + MDX-style perks** – Write posts in `content/posts/*.md` with
  frontmatter. GitHub-flavored markdown, code syntax highlighting (highlight.js)
  and KaTeX math rendering are pre-wired.
- **Storm mode** – Infinite-scroll inspiration wall fed by
  [`content/posts/storm/storm.md`](content/posts/storm/storm.md). Quotes are
  sampled, animated, and highlighted as you move.
- **Accessibility-aware motion** – Animation hooks such as
  [`usePrefersReducedMotion`](hooks/usePrefersReducedMotion.ts) gate heavy
  transitions for users who prefer minimal movement.
- **Ready for production** – App Router, file-based routing, Tailwind CSS,
  reusable hooks, and Vercel Speed Insights instrumentation (`app/layout.tsx`).

## Getting started

```bash
pnpm install   # or: npm install / yarn
pnpm dev       # starts http://localhost:3000
```

The project targets Node.js 18.17+ (Next.js 14 baseline). Use `pnpm build` or
`pnpm start` for production.

### Available scripts

| Command        | Purpose                              |
| -------------- | ------------------------------------ |
| `pnpm dev`     | Run the Next.js development server.  |
| `pnpm build`   | Create an optimized production build.|
| `pnpm start`   | Serve the production build.          |
| `pnpm lint`    | Run the Next.js ESLint configuration.|

## Project structure

```
app/                Route handlers & pages (App Router)
  page.tsx          Home view – letter cloud + recent posts
  archive/          Paginated archive with tag filters
  posts/[slug]/     Individual post pages
  storm/            Infinite quote wall
components/         UI primitives (cards, transitions, hero)
content/posts/      Markdown content source (posts & about page)
hooks/              Client-side hooks (transitions, motion)
lib/                Content utilities (markdown parsing, storm data)
public/             Static assets (favicons, social images)
tailwind.config.ts  Tailwind theme definition
```

## Authoring content

All posts live under `content/posts/` as markdown files with YAML frontmatter.
Minimal metadata looks like:

```yaml
---
title: "Signal Capture"
date: "2024-06-01"
tags: [studio, research]
excerpt: "Optional custom teaser"
readingTime: "5 min read"  # optional; auto-calculated when omitted
---

Your markdown body goes here.
```

What the pipeline does for you:

- Parses frontmatter with `gray-matter` and normalizes tags.
- Generates excerpts by stripping markdown and trimming to 320 characters when
  no custom `excerpt` is supplied.
- Calculates reading time (~200 wpm) if `readingTime` is missing.
- Sorts posts newest-first and exposes summaries through `getAllPosts()`.

The **About** page reuses the post renderer. Populate
`content/posts/about/about.md` to change its copy.

### Markdown capabilities

- GitHub-flavored markdown (tables, strikethrough, task lists) via `remark-gfm`.
- Inline and block math through `remark-math` and `rehype-katex`.
- Syntax highlighting for Bash, JavaScript/TypeScript, JSON, and Python code
  blocks with `rehype-highlight` + highlight.js.
- Sanitization to keep embedded HTML safe (`rehype-sanitize`).

### Storm quotes

The Storm page (`/storm`) draws from `content/posts/storm/storm.md`. Supply a
frontmatter array of objects:

```yaml
---
quotes:
  - text: "The signal is in the noise."
    author: "Ada"
    source: "Lab Notes"
---
```

Quotes missing `author` or `source` are still rendered. The page batches quotes,
infinite-scrolls through random samples, and highlights entries under the
pointer.

## Customizing the experience

- **Hero tuning** – Adjust word, colors, physics, and idle cycle values in
  `CONFIG` inside [`components/LetterCloud.tsx`](components/LetterCloud.tsx).
- **Transition feel** – Page transitions live in
  [`hooks/usePageTransition.ts`](hooks/usePageTransition.ts) and
  [`components/PostPageTransition.tsx`](components/PostPageTransition.tsx).
- **Tailwind theme** – Update `tailwind.config.ts` and `app/globals.css` for
  typography, gradients, or spacing.
- **Navigation & copy** – Header and call-to-actions are in
  [`components/BlogMain.tsx`](components/BlogMain.tsx) and archive/about
  components under `app/`.

## Deployment

The project is ready for Vercel:

1. Push the repository to your own Git remote.
2. Create a Vercel project and import the repo.
3. Build command: `next build` (default). Output is handled automatically.
4. No environment variables are required out of the box.

Static hosting or other Node targets work as well via `pnpm build` + `pnpm start`.

## Maintenance notes

- Clean up remote branches with [`docs/branch-maintenance.md`](docs/branch-maintenance.md).
- Keep dependencies current to receive security patches for Next.js, Tailwind,
  and remark/rehype plugins.

Bring your words – the cloud will do the rest.
