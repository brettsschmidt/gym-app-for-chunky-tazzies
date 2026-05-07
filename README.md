# gym-app-for-chunky-tazzies

A workout + nutrition tracker for chunky tazzies — log sessions, plan workouts,
track macros, and share progress with your gym buddies (your *chunky tazzle*).

Architecture mirrors [Baby-food](https://github.com/brettsschmidt/Baby-food)
and shares the same Supabase project; the gym app lives in its own `gym`
Postgres schema while identity (`public.profiles`) is shared.

## Stack

- Next.js 16 (App Router, Server Actions) + React 19 + TypeScript 5
- Supabase (`@supabase/supabase-js` + `@supabase/ssr`)
- Tailwind CSS 4 + shadcn/ui (new-york) + Radix UI + lucide
- react-hook-form + zod
- @serwist/next (PWA, push notifications)
- Playwright + axe-core for E2E + accessibility checks
- Vercel (primary) + Cloudflare Workers (`@opennextjs/cloudflare`)

## Setup

```bash
nvm use            # Node 22
npm install
cp .env.example .env.local   # fill in Supabase + VAPID keys
npm run icons:gen            # generate PWA icons
npm run dev                  # http://localhost:3000
```

### Supabase

1. Open the SHARED Supabase project (the one Baby-food uses).
2. **Run** `supabase/migrations/0001_init.sql` in the SQL editor.
3. **Project Settings → API → "Exposed schemas"**: add `gym`.
4. Generate types: `npm run db:types` (after `supabase link --project-ref <ref>`).

The gym app's main client is pinned to `db: { schema: "gym" }` so
`.from("exercises")` resolves to `gym.exercises`. A separate
`createSupabasePublicServerClient()` exists for reading `public.profiles`
(which Baby-food owns).

### Web push (optional)

```bash
npx web-push generate-vapid-keys
```

Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` in
`.env.local`. The PWA `<PushSubscribeToggle />` enables/disables per-device.

## Scripts

| | |
|---|---|
| `npm run dev` | local dev server (`--webpack`) |
| `npm run build` | production build |
| `npm run start` | start production server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm run db:types` | regenerate `types/supabase.ts` |
| `npm run icons:gen` | generate PWA icons |
| `npm run test:e2e` | Playwright + axe |
| `npm run preview` | Cloudflare worker preview (OpenNext build + run) |
| `npm run deploy` | Cloudflare deploy |
| `npm run cf-typegen` | regenerate Cloudflare env types |

## Features

- **Chunky tazzles**: gym-buddy groups (rename of Baby-food's "households"),
  invite-code based; everyone in a tazzle can see each other's sessions and meals.
- **Exercise catalog**: ~50 seeded global exercises + your tazzle's custom ones,
  filterable by muscle / equipment.
- **Workout templates**: drag-ordered exercise lines with per-exercise
  *progression rules* (linear, double-progression, %1RM, none).
- **Programs**: multi-week × day grid scheduling templates.
- **Sessions**: live logger with rest timer; PRs (estimated 1RM, reps@weight)
  computed automatically by a Postgres trigger.
- **Nutrition**: foods catalog (with global seed), meal logging with macros,
  daily targets vs. macros (rings), water tracking, recipe builder, and
  barcode scanning (BarcodeDetector + OpenFoodFacts fallback).
- **Public sharing**: revocable links for templates, programs, sessions, and
  recipes (`/share/<slug>`).
- **PWA**: installable, offline-aware service worker, web-push notifications.
- **Realtime**: tazzle members see each other's new sessions / meals live.

## Deploy

### Vercel

Push to GitHub, import on Vercel, set the env vars from `.env.example`. The
`vercel.json` enables a weekly cron at `/api/cron/digest`.

### Cloudflare Workers

```bash
npm run preview     # local Worker preview
npm run deploy      # publish
```

Secrets are managed via `wrangler secret put` (or `.dev.vars` locally — see
`.dev.vars.example`).
