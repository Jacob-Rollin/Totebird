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
| Payments | **Stripe** Checkout |

## What works without keys (demo mode)

If `DATABASE_URL` or Clerk keys are missing (or `DEMO_MODE=true`), the app runs with an **in-memory store** and seeded demo links:

| Route | What you get |
|---|---|
| `/` | Full marketing landing |
| `/demo` | Pick seeded checklist or invoice (no signup) |
| `/c/demo-checklist` | Passwordless checklist + file metadata |
| `/i/demo-invoice` | Invoice page (pay needs Stripe) |
| `/app` | Freelancer dashboard as demo user |
| `/admin` | Founder admin (open in demo when no allowlist set) |

Missing integrations degrade gracefully (upload metadata without R2, pay button explains Stripe missing, reminders log without Resend).

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See [`.env.example`](./.env.example). Summary:

| Variable | Required for |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Absolute client links / Stripe redirects |
| `ADMIN_EMAIL` / `ADMIN_USER_IDS` | Founder `/admin` allowlist |
| `DATABASE_URL` | Neon (real persistence) |
| `NEXT_PUBLIC_CLERK_*` / `CLERK_SECRET_KEY` | Freelancer auth |
| `R2_*` | Presigned uploads |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Reminders |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Invoice Checkout |

### Founder admin access

`/admin` is gated to emails in `ADMIN_EMAIL` (comma-separated) and/or Clerk user IDs in `ADMIN_USER_IDS`.

In demo mode with an empty allowlist, the demo session is treated as admin so you can explore the UI. Once Clerk + `ADMIN_EMAIL` are set, only allowlisted accounts can open `/admin`.

Admin covers: overview metrics, users (disable/flag), links (disable), invoices list. Stripe Dashboard remains source of truth for payouts.

## Platform setup

### 1. Neon

1. Create a project → copy the connection string to `DATABASE_URL`.
2. Apply schema:

```bash
npm run db:push
# or: npm run db:migrate
```

SQL also lives in `src/db/migrations/0000_init.sql`.

### 2. Clerk

1. Create an application (Hobby).
2. Add keys to `.env.local`.
3. Set sign-in/up URLs to `/sign-in` and `/sign-up`.
4. Optional: webhook to `/api/webhooks/clerk` for user sync (`CLERK_WEBHOOK_SECRET`).

### 3. Cloudflare R2

1. Create bucket + API token (Object Read & Write).
2. Set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`.
3. Optional `R2_PUBLIC_URL` if you expose a public/custom domain.

### 4. Resend

1. API key → `RESEND_API_KEY`.
2. Start with `RESEND_FROM_EMAIL=Totebird <onboarding@resend.dev>` or verify your domain.

### 5. Stripe

1. Test mode keys → env.
2. Webhook endpoint: `POST /api/webhooks/stripe` for `checkout.session.completed`.
3. Set `STRIPE_WEBHOOK_SECRET`.

### 6. Netlify

1. Link this repo; build uses `@netlify/plugin-nextjs` (`netlify.toml`).
2. Paste the same env vars in the Netlify UI.
3. Point `totebird.com` (when purchased) at the site; until then use the Netlify subdomain and set `NEXT_PUBLIC_APP_URL`.

## App routes

| Path | Audience |
|---|---|
| `/` | Marketing |
| `/demo` | Seeded client demos (no account) |
| `/app` | Freelancer dashboard |
| `/app/links/new` | Create checklist or invoice |
| `/admin` | Founder platform admin |
| `/c/[token]` | Client checklist |
| `/i/[token]` | Client invoice |

## Brand

Assets from the Totebird logo pack live under `public/brand/` (wordmarks with **open counters**, favicons, OG). Palette: slate `#394554`, orange `#EE901F`.

## Pricing (enforced direction)

| Tier | Price | Caps |
|---|---|---|
| Free | $0 | 3 active links, 250 MB |
| Solo | $19/mo ($190/yr) | 25 links, 25 GB |
| Studio | $39/mo ($390/yr) | Unlimited fair use, 100 GB |

Stripe Billing for Solo/Studio can follow once core loops are live.

## Deferred

Briefs, testimonials, custom domains, webhooks, multi-seat Studio polish, SMS.
