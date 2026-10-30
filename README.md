# Totebird

Passwordless client links for freelancers — **checklist / file-drop** and **invoice** (Stripe).

> One link out. Everything flies home.

## Deploy on Netlify (you already have a site named **totebird**)

Practical steps only. Full click-path walkthrough for Neon/Clerk/R2/Resend/Stripe lives in the Project **platform setup guide** — use this README for repo/branch/env/cron.

### 1. Link the GitHub repo

1. Open the **totebird** site → **Site configuration → Build & deploy → Continuous deployment**
2. Connect **`Jacob-Rollin/Totebird`**
3. **Production branch:** **`main`**
4. Build settings are in [`netlify.toml`](./netlify.toml):
   - Build command: `npm run build`
   - Plugin: `@netlify/plugin-nextjs` (publish `.next` — do not point publish at `out/` or `dist/`)
5. Trigger a deploy. Without Neon/Clerk the site still runs in **demo mode**.

### 2. Env vars to set first

In **Site configuration → Environment variables** (same names as [`.env.example`](./.env.example)):

| Priority | Variable | Example / note |
|---|---|---|
| Done | `NEXT_PUBLIC_APP_URL` | `https://YOUR-SITE.netlify.app` |
| Done | `DATABASE_URL` | Neon on Netlify — hosted app uses it after deploy |
| Now | `ADMIN_EMAIL` | Email you will Sign up with (founder `/admin`) |
| Now | Clerk keys + path vars | See `.env.example` — then **one redeploy** |
| Next | `R2_*`, `RESEND_*` | Uploads + email |
| Next | `STRIPE_*` + Price IDs | Webhook URL below |
| Optional | `CRON_SECRET` | Locks down daily reminder cron |
| Later (laptop only) | `npm run db:push` | Only if you run locally with `DATABASE_URL` in `.env.local` — **not** required for Netlify after Clerk |

Redeploy after adding vars (or enable “builds on env change”). Local checklist (no values printed): `npm run prove:env`.

### 3. Stripe webhook URL

In Stripe Dashboard → Developers → Webhooks → Add endpoint:

```text
https://YOUR-SITE.netlify.app/api/webhooks/stripe
```

Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, plus Connect `account.updated` / `account.application.deauthorized` when using Express. Enable **Listen to events on Connected accounts** once Connect invoices go live.  
Paste signing secret → `STRIPE_WEBHOOK_SECRET`. Optional: `STRIPE_CONNECT_ENABLED=true` + `STRIPE_PLATFORM_FEE_BPS=100` after Dashboard Connect setup.

### 4. Scheduled reminders (Netlify)

- Function: [`netlify/functions/scheduled-reminders.mts`](./netlify/functions/scheduled-reminders.mts) runs **daily 14:00 UTC**
- It `POST`s `{NEXT_PUBLIC_APP_URL}/api/cron/reminders` with `Authorization: Bearer $CRON_SECRET`
- Without `RESEND_API_KEY`, the pass **logs** reminders (no send)
- Manual test (local or prod):

```bash
curl -X POST "$NEXT_PUBLIC_APP_URL/api/cron/reminders" \
  -H "Authorization: Bearer $CRON_SECRET"
```

If `CRON_SECRET` is unset, the route stays open (fine for local demo; set a secret in production).

### 5. Deploy tips

- Smoke after each deploy: `/`, `/demo`, `/app`, `/app/settings`, `/admin`
- Custom domain later: update `NEXT_PUBLIC_APP_URL` + Clerk allowed origins + Stripe webhook URL
- Production branch stays **`main`**
- Local parity: `cp .env.example .env.local && npm i && npm run prove:env && npm run dev`
- Note: Netlify demo-mode data is in-memory per instance (ephemeral) until Neon + Clerk are both live
- **Credits:** each production deploy ≈ 15 Free credits. `netlify.toml` skips Deploy Previews / branch deploys and skips production rebuilds that only touch markdown/docs. Batch merges; avoid casual **Trigger deploy**. Turn Deploy Previews **off** in the Netlify UI as well.

---

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
| `/app/settings` | Onboarding checklist (Neon/Clerk/Stripe/R2/Resend/cron) |
| `/admin` | Founder admin + search filters |
| `/privacy`, `/terms` | Legal stubs (marked as templates) |
| `/api/cron/reminders` | Reminder pass (logs without Resend) |

Missing integrations degrade gracefully (upload metadata without R2; pay/upgrade explain missing Stripe; reminders log without Resend).

## Quick start (local)

```bash
cp .env.example .env.local
npm install
npm run prove:env   # SET/MISSING checklist — never prints secret values
npm run dev
```

```bash
npm run build && npm run start
# another terminal:
npm run smoke
```

## Environment variables

See [`.env.example`](./.env.example). Create Stripe Products/Prices for Solo ($19 / $190) and Studio ($39 / $390), paste Price IDs, enable **Customer Portal**. Connect Express stays off until `STRIPE_CONNECT_ENABLED=true`.

### Founder admin

`/admin` is gated to `ADMIN_EMAIL` (comma-separated) and/or `ADMIN_USER_IDS`. In demo mode with an empty allowlist, the demo session is admin.

## Features (keyless-complete)

- **Plan limits** — Free = 3 active links + 250 MB messaging; enforced on create
- **Billing** — `/app/billing` upgrade Checkout + Customer Portal (needs Stripe + Price IDs); demo plan switch without keys; Connect Express scaffold on Settings
- **Checklist** — templates, item types, progress %, duplicate / archive
- **Invoice** — line items, due presets, mark paid manually, print view
- **Email pack** — reminder / overdue / paid templates (console without Resend)
- **Scheduled reminders** — Netlify daily function → `/api/cron/reminders`
- **Settings** — connect-platform checklist at `/app/settings`
- **Legal** — `/privacy`, `/terms` stubs

## Neon / schema

Linked via [`neon.ts`](./neon.ts) + `.neon` (gitignored) to project `shiny-rice-23336236` / branch `production`. Postgres only — no Neon Auth / Object Storage (app uses Clerk + R2). Driver: `@neondatabase/serverless` + Drizzle HTTP (Netlify-friendly).

**Hosted:** put `DATABASE_URL` in Netlify env (already done if you followed setup). Redeploy after Clerk — that is enough for the live site. Netlify does **not** run `db:push`.

**Local later (optional):** only when you develop on a laptop with the same URL in `.env.local`:

```bash
neon login                 # browser once (or NEON_API_KEY)
neon env pull              # writes DATABASE_URL into .env.local
neon deploy                # applies neon.ts
npm run db:push            # Drizzle schema → Neon
npm run prove:db           # insert/select/delete smoke
```

Migrations also in `src/db/migrations/` (`0000_init` + `0001_enrich` + `0002_stripe_connect`).

### Clerk

Sign-in/up → `/sign-in`, `/sign-up`; after auth → `/app`.

### R2 / Resend / Stripe

Follow [`.env.example`](./.env.example) and the Project platform setup guide. Webhook: `POST /api/webhooks/stripe` (Billing + Connect `account.*`). Netlify deploy steps are at the top of this README.

## App routes

| Path | Audience |
|---|---|
| `/` | Marketing |
| `/demo` | No-account demos |
| `/app` | Freelancer dashboard |
| `/app/billing` | Plans / upgrade |
| `/app/settings` | Platform onboarding |
| `/admin` | Founder admin |
| `/c/[token]` | Client checklist |
| `/i/[token]` | Client invoice |
| `/api/cron/reminders` | Scheduled reminder pass |
| `/api/webhooks/stripe` | Stripe webhook |

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
