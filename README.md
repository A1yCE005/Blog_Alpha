# Letter Cloud Blog

Midjourney-style letter-cloud hero animation as a minimalist blog homepage.

## Stack
- Next.js 14 (app router)
- React 18
- Tailwind CSS
- Framer Motion

## Quickstart

```bash
pnpm i   # or: npm i / yarn
pnpm dev # or: npm run dev
```

Then open http://localhost:3000

## Repository maintenance

If you need to clean up old remote branches (for example the `codex/*`
branches shown in the GitHub branch picker), follow the checklist in
[`docs/branch-maintenance.md`](docs/branch-maintenance.md) to audit, delete,
and prune them safely.

## Deploy to Vercel

1. Push this folder to a new Git repo (GitHub/GitLab/Bitbucket).
2. On Vercel, **New Project** → import the repo.
3. Framework: **Next.js** (auto-detected).
4. Build command: `next build` (default). Output: `.vercel/output` (handled by Next). No extra env needed.
5. Click **Deploy**.

## Customize

- Edit the animation defaults in `components/LetterCloud.tsx` (`CONFIG`).
- Replace texts/sections in the same file for a different site tone.
- Tailwind config lives in `tailwind.config.ts`; global styles in `app/globals.css`.
