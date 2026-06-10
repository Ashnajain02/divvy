<div align="center">

# 🧾 Divvy

### *Split the bill, not the friendship.*

**Snap a receipt → tap who got what → settle up in one tap.**
Divvy turns a photo of a restaurant or retail receipt into a fair, itemized,
per-person total in seconds — then makes getting paid back effortless.

**🔗 Live: [div-vy.vercel.app](https://div-vy.vercel.app)**

</div>

---

## Table of contents

- [The problem](#the-problem)
- [What Divvy does](#what-divvy-does)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
  - [1. The app — a client-side wizard](#1-the-app--a-client-side-wizard)
  - [2. The receipt-parsing pipeline](#2-the-receipt-parsing-pipeline-the-hard-part)
  - [3. Splitting math](#3-splitting-math)
  - [4. Shareable links — no accounts, real-time-ish sync](#4-shareable-links--no-accounts-real-time-ish-sync)
  - [5. Getting paid back](#5-getting-paid-back-prefilled-venmo)
  - [6. The chat preview (dynamic OG image)](#6-the-chat-preview-dynamic-og-image)
  - [7. The landing page](#7-the-landing-page)
  - [8. Analytics](#8-analytics)
- [Notable engineering decisions](#notable-engineering-decisions)
- [Project structure](#project-structure)
- [Data model](#data-model)
- [Design system](#design-system)
- [Local development](#local-development)
- [Deployment](#deployment)
- [Intentionally deferred](#intentionally-deferred)

---

## The problem

Splitting a group bill is a small, universal, weirdly stressful chore:

- **The math is annoying.** Itemizing who had what, then fairly spreading tax,
  tip, and service charges, is fiddly — so people just "split it evenly," which
  quietly overcharges whoever had a salad and water.
- **Getting paid back is worse.** The person who fronted the bill becomes the
  group's bank: *"what's your Venmo?"*, *"how much do I owe again?"*, *"did
  everyone pay me?"* — often days of low-grade nagging.
- **Existing tools are heavy.** Ledger apps like Splitwise are great for ongoing
  balances but force everyone to make an account, and their best feature
  (receipt scanning) is paywalled and mediocre.

Divvy attacks the **moment** of splitting one bill and the **payback** that
follows — fast, fair, and with zero signup for the people you're splitting with.

## What Divvy does

A single mobile-first flow, start to settled:

| Step | What happens |
|---|---|
| **📷 Scan** | Snap the receipt (or pick from your library). |
| **🤖 Parse** | GPT-4o vision reads every item, the tax, tip, service charge, and discounts into structured data — and **verifies the math** before trusting it. |
| **✍️ Review** | Edit any item, fix totals, **split** an item in two, **group** add-ons (e.g. "+ guac") under a parent dish, or add items by hand. |
| **👆 Assign** | Type your group's names (one field, comma-separated), then tap name-chips to assign each item. Shared plates split evenly among assignees. |
| **🧮 Summarize** | Per-person totals with an itemized breakdown. Toggle tax/tip split **even vs. proportional** — both reconcile to the cent. |
| **🔗 Share** | Copy or share a link. The recipient sees their share **with no app and no signup**. |
| **💸 Settle** | Each person taps **Venmo** — pre-filled with the exact amount and your handle — and marks themselves paid. You watch it tick off live. |

## Tech stack

- **[Next.js 16](https://nextjs.org)** (App Router, async `params`/`searchParams`, Turbopack)
- **TypeScript** (strict, no unjustified `any`)
- **Tailwind CSS 4** (`@theme` design tokens, custom warm palette)
- **[OpenAI](https://platform.openai.com) GPT-4o** vision, via **Structured Outputs** (strict `json_schema`) using **[Zod](https://zod.dev)** + `zodResponseFormat`
- **[Upstash Redis](https://upstash.com)** (REST) for shareable-link persistence
- **[Vercel](https://vercel.com)** hosting + **Web Analytics** + **Speed Insights**
- **[PostHog](https://posthog.com)** for product analytics (funnels, autocapture)
- **No UI library, no state library.** Native HTML + Tailwind + `useState`/lifted
  state. Custom inline-SVG logo and icon set (no emoji, no icon font).

---

## Architecture

Divvy is a Next.js App Router app with three real routes (`/`, `/app`, `/s/[id]`)
plus a small set of API routes. The interesting parts are the **parsing
pipeline**, the **no-account share model**, and the **landing-page animation**.

### 1. The app — a client-side wizard

The whole capture → review → assign → summary flow lives in one client component
([`app/app/page.tsx`](app/app/page.tsx)) as a **screen state machine** — no
routing between steps, no global state library, just `useState` and lifted
state. Each screen ([`components/screens/`](components/screens/)) is a pure-ish
view that receives the working `SplitSession` and an `onChange`.

Past splits are kept in **`localStorage`** ([`lib/local-storage.ts`](lib/local-storage.ts));
there are no user accounts in v1.

### 2. The receipt-parsing pipeline (the hard part)

[`app/api/parse/route.ts`](app/api/parse/route.ts) is where the magic — and the
reliability engineering — lives. Two layers stack on top of each other:

1. **Strict Structured Outputs.** The request uses
   `zodResponseFormat(ParsedReceiptSchema, "receipt")`
   ([`lib/receipt-schema.ts`](lib/receipt-schema.ts)), so GPT-4o *physically
   cannot* return malformed or incomplete JSON — every field is present and
   correctly typed. No fence-stripping, no defensive parsing.

2. **A math-verifier + self-correction retry loop.** The model is good but not
   perfect, so we don't trust it blindly. After each response we check the
   printed-math identities:

   ```
   Σ(items) − Σ(discounts) ≈ printed_subtotal
   subtotal + tax + service + tip ≈ printed_total
   unit_price × quantity ≈ line_total      (per item)
   ```

   If anything is off by more than ±$0.05, we **feed the specific discrepancy
   back to the model** and ask it to re-read (up to 3 attempts). A "too low"
   item sum even nudges it specifically about dropped or merged duplicate rows —
   a real failure mode when two people order the same dish. If it still can't
   reconcile, we return the best-effort parse flagged `needs_review` so the UI
   can warn the user instead of failing.

The [system prompt](lib/parse-prompt.ts) encodes a lot of hard-won domain
knowledge: gratuity always maps to tip (never service charge), tax-inclusive
international receipts, discount detection, what to skip (card-auth lines,
section headers), and — importantly — **never deduplicate identical line items**.

Images are downscaled/normalized client-side ([`lib/image.ts`](lib/image.ts))
before upload to keep the vision payload fast.

### 3. Splitting math

All money logic is pure and dependency-free in
[`lib/compute.ts`](lib/compute.ts), shared by the in-app summary and the public
share page:

- Each item's total divides evenly among its assignees.
- **Extra charges** (`tax + service + tip − discount`) distribute either
  **evenly** across people or **proportionally** to each person's item subtotal.
- Edge cases handled: nothing assigned → split everything evenly; zero items →
  split charges evenly.

Item transforms (split-in-two, group-into-add-on, ungroup) are pure functions in
[`lib/session.ts`](lib/session.ts). Both split modes reconcile to the grand
total within a cent.

### 4. Shareable links — no accounts, real-time-ish sync

The defining UX choice: **the people you split with never sign up.**

- `POST /api/split` writes the session to Upstash and returns a **10-char
  `crypto`-random ID** ([`lib/id.ts`](lib/id.ts)). *The link is the secret* —
  there's no auth (a deliberate v1 trade-off).
- `/s/[id]` ([`app/s/[id]/page.tsx`](app/s/[id]/page.tsx) +
  [`components/SharedView.tsx`](components/SharedView.tsx)) renders a read-only
  view where anyone can mark themselves paid (`PATCH /api/split/[id]`).
- **Two-way paid-status sync via polling** (no WebSockets, per the spec): the
  app's Summary and the shared page each poll every ~7s, so when a friend marks
  paid, the bill-payer sees it — and vice-versa. Polling is skipped mid-toggle to
  avoid clobbering optimistic updates.
- **Receipt photos are never uploaded** — they stay on the creator's device. The
  share store only ever holds the structured split.

### 5. Getting paid back (prefilled Venmo)

[`lib/venmo.ts`](lib/venmo.ts) builds Venmo deep links:

- On the **shared link**, each unpaid person gets a **Venmo** button
  pre-addressed to the bill-payer's saved handle with the exact amount
  (`https://venmo.com/<handle>?txn=pay&amount=…&note=…`). One tap — no searching
  for a username, no typing an amount.
- The payer's Venmo handle is saved once on the Home screen (with an `@` prefix
  helper) and auto-fills every future link.

### 6. The chat preview (dynamic OG image)

When a share link is pasted into iMessage/WhatsApp/Slack, it unfurls as a
branded **invitation card** generated per-split at request time
([`app/s/[id]/opengraph-image.tsx`](app/s/[id]/opengraph-image.tsx), Next.js +
Satori): the Divvy logo, the restaurant name, and "Tap to see what you owe →".
Fonts and the logo are fetched over HTTPS at runtime (a Turbopack-safe approach
after colocated-asset reads turned out not to bundle into the serverless
function). This turns every share into a viral, branded invite seen by the whole
group thread.

### 7. The landing page

The marketing site ([`app/page.tsx`](app/page.tsx)) is its own little showcase:

- A **scroll-scrubbed hero** where the logo's fork & spoon pull the "D" apart to
  reveal the wordmark ([`SplitHero`](components/landing/SplitHero.tsx)), driven
  by a pinned section + a `--p` progress CSS variable.
- A **scroll-driven phone tour** that cross-fades through the four real app
  screens ([`AppTour`](components/landing/AppTour.tsx)), built from the actual
  app primitives so it's pixel-identical to the product.
- An animated **"No more…"** section ([`NoMore`](components/landing/NoMore.tsx))
  and a **before/after "Settle up"** section
  ([`SettleSection`](components/landing/SettleSection.tsx)).

All animations are pure CSS/transform (no animation library), GPU-promoted, and
**reduced-motion safe**. Scroll handlers cache layout metrics so they never
force a per-frame reflow — the key to smoothness on mobile.

### 8. Analytics

- **Vercel Web Analytics + Speed Insights** for traffic and Core Web Vitals.
- **PostHog** ([`components/analytics/PostHogProvider.tsx`](components/analytics/PostHogProvider.tsx))
  for autocapture (every click) + named funnel events fired through
  [`lib/track.ts`](lib/track.ts): `scan_started`, `parse_succeeded`/`parse_failed`,
  `summary_reached`, `link_copied`/`link_shared`, `marked_paid`, and the viral-loop
  events on the shared page (`shared_opened`, `shared_venmo_clicked`, …). The
  provider no-ops gracefully when no key is set.

---

## Notable engineering decisions

| Decision | Why |
|---|---|
| **Structured Outputs + a math verifier** | LLM JSON is unreliable two ways: *shape* and *correctness*. Strict schemas fix shape; a deterministic verifier + retry loop fixes correctness. Neither alone is enough. |
| **No accounts; the link is the secret** | The single biggest friction in bill-splitting is making everyone sign up. Removing it is the whole product. |
| **Receipt photos never leave the device** | Privacy. The structured split is all anyone needs; the raw photo (which may show card digits) stays local. |
| **Polling, not WebSockets, for paid sync** | "Real-time enough" for a settle-up screen, far simpler, and free on serverless. |
| **No UI/state library** | The app is small enough that native HTML + Tailwind + `useState` keeps the bundle tiny and the code obvious. |
| **Pure money math in one module** | `lib/compute.ts` is deterministic and shared by the app and the public share page, so totals can't drift between them. |
| **Cost-conscious by design** | Env clients are instantiated *inside* request handlers (never at module load) so the build never needs secrets; images are downscaled before the vision call. |

---

## Project structure

```
app/
  layout.tsx              Root layout: fonts, metadata, analytics providers
  page.tsx                Marketing landing (scroll-animated)
  globals.css             Tailwind @theme tokens + keyframes
  app/page.tsx            The product: capture→review→assign→summary wizard
  s/[id]/
    page.tsx              Public shared split (+ generateMetadata for unfurls)
    opengraph-image.tsx   Per-split chat-preview card (Satori)
  styleguide/page.tsx     Visual reference for every design primitive
  api/
    parse/route.ts        GPT-4o vision parse + math-verify + retry loop
    split/route.ts        Create a shared split (Upstash)
    split/[id]/route.ts   Read / patch (mark paid) a shared split

components/
  screens/                HomeScreen, CaptureScreen, ReviewScreen,
                          AssignScreen, SummaryScreen
  landing/                SplitHero, AppTour, NoMore, SettleSection,
                          Header, Reveal
  SharedView.tsx          The /s/[id] interactive view
  ui.tsx                  Buttons, Card, Chip, Sheet, NavBar, type scale…
  icons.tsx               Inline-SVG icon set
  inputs.tsx              MoneyInput, TextField
  Logo.tsx, ReceiptViewer.tsx
  analytics/PostHogProvider.tsx

lib/
  compute.ts              Pure splitting math (shared everywhere)
  session.ts              Session factory + item transforms
  receipt-schema.ts       Zod schema → Structured Outputs + ParsedReceipt type
  parse-prompt.ts         The GPT-4o system prompt
  redis.ts                Upstash client (instantiated per-request)
  local-storage.ts        History + saved Venmo handle
  venmo.ts                Venmo pay/charge deep links
  image.ts                Client-side downscale/normalize
  theme.ts                Color tokens (also used by inline styles)
  types.ts, id.ts, track.ts
```

## Data model

```ts
type SplitSession = {
  id: string;                          // 10-char crypto-random share id
  createdAt: number;
  restaurantName: string;
  items: LineItem[];
  discount: number;
  tax: number;
  serviceCharge: number;
  tip: number;
  people: string[];                    // names
  paidStatus: Record<string, boolean>; // name → paid
  splitTaxTipEvenly: boolean;          // even vs. proportional
  currency?: string;                   // captured from the receipt
  payerVenmo?: string;                 // bill-payer's handle (for pay links)
  shared?: boolean;                    // a link exists → enable paid sync
  receiptImageData?: string;           // on-device only; never persisted
};

type LineItem = {
  id: string; name: string;
  basePrice: number; quantity: number;
  addOns: { id: string; name: string; price: number }[];
  assignedTo: string[];                // person names
};
```

## Design system

Warm, slightly elegant — "small upscale neighborhood restaurant menu," not a
cold fintech dashboard. Tokens live in [`lib/theme.ts`](lib/theme.ts) and
`globals.css`; see [`/styleguide`](https://div-vy.vercel.app/styleguide).

- **Palette:** deep indigo-purple primary, dusty gold accent, warm cream
  backgrounds. Forced light — Divvy keeps its palette even in OS dark mode.
- **Type:** Fraunces (serif display) for the wordmark/headlines, system rounded
  for UI labels, system sans for body.
- **Components:** rounded cream cards, purple-gradient primary buttons, gold
  capsule "Request"/"Venmo" buttons, person chips, gold section dividers.

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build (zero TS errors)
```

Environment variables — **read only inside request handlers, never at module
load**, so the build succeeds without them:

```bash
# Core
OPENAI_API_KEY=                 # receipt parsing (GPT-4o)
UPSTASH_REDIS_REST_URL=         # shareable links
UPSTASH_REDIS_REST_TOKEN=

# Analytics (optional — app runs fine without these)
NEXT_PUBLIC_POSTHOG_KEY=        # phc_… (public, write-only ingestion key)
NEXT_PUBLIC_POSTHOG_HOST=       # https://us.i.posthog.com
```

Graceful degradation: without `OPENAI_API_KEY`, parsing returns a clear error;
without the Upstash keys, shareable links are disabled but everything else works;
without PostHog, analytics simply no-op.

## Deployment

Hosted on **Vercel**. `git push` to `main` auto-deploys; env vars are configured
in the Vercel dashboard for each environment. `NEXT_PUBLIC_*` vars are inlined at
build time, so changing them requires a redeploy.

## Intentionally deferred

v1 deliberately skips: user accounts/auth (the share URL *is* the secret),
WebSocket real-time sync (polling is enough), multi-currency UI (model is
currency-agnostic; UI is USD), and server-side photo storage (privacy).

Natural next steps: a shared-page "your turn next time" CTA to tighten the viral
loop, more payment rails (Cash App/Zelle), saved groups & trip mode, and
auto-reminders for unpaid balances.

---

<div align="center">

Built with care. **Split the bill, not the friendship.**

</div>
