# Divvy

**Split the bill, not the friendship.**

Divvy turns a photo of a receipt into a fair per-person total. Snap the receipt,
let GPT-4o read the items and totals, assign each item to one or more people,
and Divvy distributes tax, service, and tip — then share a link or fire off a
Venmo request.

## Stack

- **Next.js 16** (App Router, async `params`/`searchParams`)
- **TypeScript** (strict) + **Tailwind CSS 4** (`@theme` tokens, `prefers-color-scheme` dark mode)
- **OpenAI** GPT-4o vision with **Structured Outputs** (strict `json_schema` via `zod` + `zodResponseFormat`) for receipt parsing
- **Upstash Redis** for shareable-link persistence
- Custom inline-SVG logo + icon set (no emoji, no icon font)
- No UI library, no state library — native HTML + Tailwind + `useState`.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in the three keys below
npm run dev
```

Environment variables (read only inside request handlers, never at module load):

```
OPENAI_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Without `OPENAI_API_KEY`, parsing/voice routes return a clear 500. Without the
Upstash keys, shareable links are disabled but the rest of the app works.

## Screens & routes

| Route | What |
|---|---|
| `/` | Home → Capture → Review → Assign → Summary (client-side wizard; history in `localStorage`) |
| `/s/[id]` | Read-only shared split; tap a row to mark paid (synced to Upstash) |
| `/styleguide` | Visual reference for the logo, icons, and every design-system primitive |
| `/api/parse` | GPT-4o vision parse — strict Structured Outputs + math verification (per-item & totals) with retry-up-to-3; flags low-confidence parses for review |
| `/api/split`, `/api/split/[id]` | Create / read / patch a shared split |

## Architecture notes

- **Money math** lives in `lib/compute.ts` (pure, dependency-free) and is shared
  by the summary and share pages. Tax/tip can be split **even** or
  **proportional**; both sum to the grand total within a cent.
- **Item transforms** (split / group-into-add-on / ungroup) are pure functions
  in `lib/session.ts`.
- **Receipt photos are ephemeral** — never persisted to `localStorage`,
  `/api/split`, or Redis.
- **Share IDs** are 10 chars of `crypto` randomness (the link is the secret;
  there's no auth in v1).

## Build

```bash
npm run build   # passes with zero TypeScript errors
```
