# Totebird

Passwordless client links for freelancers — **checklist / file-drop** and **invoice** (Stripe).

> One link out. Everything flies home.

## Stack

| Piece | Choice |
|---|---|
| App | Next.js (App Router) on **Netlify** |
| DB | **Neon** Postgres + Drizzle |
| Auth (freelancers) | **Clerk** |
| Client access | Signed tokens (`/c/[token]`, `/i/[token]`) — no client accounts |
| Files | **Cloudflare R2** presigned uploads |
| Email | **Resend** |
| Payments | **Stripe** Checkout + Billing |

## What works without keys (demo mode)

If `DATABASE_URL` or Clerk keys are missing (or `DEMO_MODE=true`), the app runs with an **in-memory store** and seeded demos:

| Route | What you get |
|---|---|
| `/` | Full marketing landing |
| `/demo` | Seeded checklist + invoice (no signup) |
| `/c/demo-checklist` | Rich kickoff checklist (checkbox / text / file) |
| `/i/demo-invoice` | Line-item invoice + print view |
| `/app` | Freelancer dashboard (progress %, limits, duplicate/archive) |
| `/app/billing` | Plan UI; demo can switch Free/Solo/Studio without Stripe |
| `/admin` | Founder admin + search filters |
| `/privacy`, `/terms` | Legal stubs (marked as templates) |

Missing integrations degrade gracefully (upload metadata without R2; pay/upgrade explain missing Stripe; reminders log without Resend).

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Smoke against a running server:

```bash
npm run build && npm run start
# another terminal:
npm run smoke
```

## Environment variables

See [`.env.example`](./.env.example).

| Variable | Required for |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Absolute client links / Stripe redirects |
| `ADMIN_EMAIL` / `ADMIN_USER_IDS` | Founder `/admin` allowlist |
| `DATABASE_URL` | Neon persistence |
| `NEXT_PUBLIC_CLERK_*` / `CLERK_SECRET_KEY` | Freelancer auth |
| `R2_*` | Presigned uploads |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Reminders / receipts |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Invoice Checkout |
| `STRIPE_PRICE_SOLO_MONTHLY` / `_YEARLY` | Solo Billing |
| `STRIPE_PRICE_STUDIO_MONTHLY` / `_YEARLY` | Studio Billing |

Create Stripe Products/Prices for Solo ($19 / $190) and Studio ($39 / $390), paste Price IDs, and enable the **Customer Portal** in Stripe Dashboard.

### Founder admin

`/admin` is gated to `ADMIN_EMAIL` (comma-separated) and/or `ADMIN_USER_IDS`. In demo mode with an empty allowlist, the demo session is admin.

## Features (keyless-complete)

- **Plan limits** — Free = 3 active links + 250 MB messaging; enforced on create
- **Billing stubs** — `/app/billing` upgrade Checkout + Customer Portal (needs Stripe + Price IDs); demo plan switch without keys
- **Checklist** — templates (web kickoff, logo pack, video), item types (checkbox/text/file), required flag, progress %, duplicate / archive
- **Invoice** — line items, due presets (upon receipt / net 7/14/30), mark paid manually, print-friendly `/i/[token]/print`
- **Email pack** — HTML+text templates for checklist reminder, invoice overdue, paid receipt (console log without Resend)
- **Legal** — `/privacy`, `/terms` stubs linked from footer

## Platform setup

### Neon

Linked via [`neon.ts`](./neon.ts) + `.neon` (gitignored) to project `shiny-rice-23336236` / branch `production`.

```bash
neon login                 # browser once (or NEON_API_KEY)
neon env pull              # writes DATABASE_URL into .env.local
neon deploy                # applies neon.ts (Postgres-only; no Auth/Object Storage)
npm run db:push            # Drizzle schema → Neon
npm run prove:db           # insert/select/delete smoke
```

Migrations also in `src/db/migrations/` (`0000_init` + `0001_enrich`). Driver: `@neondatabase/serverless` + Drizzle HTTP (Netlify/serverless-friendly).

### Clerk

Sign-in/up → `/sign-in`, `/sign-up`; after auth → `/app`.

### R2 / Resend / Stripe / Netlify

Follow [`.env.example`](./.env.example) and the Project setup checklist. Webhook: `POST /api/webhooks/stripe` (`checkout.session.completed`, subscription updated/deleted).

## App routes

| Path | Audience |
|---|---|
| `/` | Marketing |
| `/demo` | No-account demos |
| `/app` | Freelancer dashboard |
| `/app/billing` | Plans / upgrade |
| `/admin` | Founder admin |
| `/c/[token]` | Client checklist |
| `/i/[token]` | Client invoice |
| `/i/[token]/print` | Printable invoice |

## Brand

`public/brand/` — open-counter wordmarks, favicons, OG. Palette: slate `#394554`, orange `#EE901F`.

## Pricing

| Tier | Price | Caps |
|---|---|---|
| Free | $0 | 3 active links, 250 MB |
| Solo | $19/mo ($190/yr) | 25 links, 25 GB |
| Studio | $39/mo ($390/yr) | Unlimited fair use, 100 GB |

## Deferred

Briefs, testimonials, custom domains, multi-seat Studio polish, SMS, counsel-reviewed legal.
