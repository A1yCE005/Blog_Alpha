# Architecture Overview

This document captures a high-level mental model of how the Letter Cloud blog operates so new contributors can navigate the codebase quickly.

## Runtime flow

- **Entry point (`app/page.tsx`)** – The default route is an async server component that gathers all post summaries via `getAllPosts` and renders the interactive hero/reader experience exposed by `<LetterCloud />`.
- **Interactive shell (`components/LetterCloud.tsx`)** – A client component that drives the landing animation and the transition into the blog reader. It manages:
  - A custom `WordParticles` canvas renderer that samples a target word, spawns particles, and animates their drop, morph, idle carousel, and exit behaviors.
  - View state that determines whether the hero is visible, whether the blog overlay should open, and updates the URL search params (`?view=blog`).
  - Accessibility affordances such as reduced-motion detection and keyboard activation for the hero call-to-action.
- **Blog overlay (`components/BlogMain.tsx`)** – Renders the post list on top of the hero with Tailwind-styled cards. Visibility is controlled by `LetterCloud` so that it fades/slides in when the hero retires.

## Content pipeline

- **Markdown loading (`lib/posts.ts`)** – Uses Node file system APIs and `gray-matter` to load markdown files from `content/posts`. Metadata is normalized (title, date, tags, excerpts, reading time) and sorted so that the newest post appears first.
- **Static post pages (`app/posts/[slug]/page.tsx`)** – Generates static params and metadata at build time. For a given slug it renders markdown through `react-markdown`, enabling GFM, math, and KaTeX via remark/rehype plugins. The page also links back to the hero with a `view=blog` query to reopen the overlay.

## Styling and animation

- Tailwind CSS (configured in `tailwind.config.ts`) provides the utility classes used across components, while global styles live in `app/globals.css`.
- The hero animation relies on an imperative canvas loop inside `WordParticles`, which performs:
  - Rendering of the particle field, including background glyphs.
  - Multi-phase motion (drop ➝ funnel ➝ formation ➝ idle carousel) with parameters centralized in the local `CONFIG` object.
  - Mouse interaction (repel force) and graceful exit transitions when the blog view opens.

## Data and configuration touchpoints

- Blog content resides in `content/posts/*.md`; adding a new file automatically populates the overlay list and generates a detail page.
- Particle behavior, colors, and idle word rotation can be tuned by editing the `CONFIG` constant inside `components/LetterCloud.tsx`.
- Routing is handled exclusively by the Next.js App Router; server components fetch data, while client components orchestrate animations and interactivity.

Use this as a starting point when diving deeper into specific features or when planning enhancements.
