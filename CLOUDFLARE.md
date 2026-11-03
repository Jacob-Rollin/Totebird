# Cloudflare Workers — env vars that survive deploy

Two Workers on the Totebird account. They do **not** share Variables.

| Worker | Repo config | How it deploys |
|---|---|---|
| **`totebird`** (Next.js app) | root [`wrangler.jsonc`](./wrangler.jsonc) | Workers Builds on `main` (and `npm run build:cf` + `npm run deploy:cf`) |
| **`totebird-files-b2`** (CDN) | [`workers/files-b2/wrangler.toml`](./workers/files-b2/wrangler.toml) | Manual `cd workers/files-b2 && npm run deploy` |

Both set **`keep_vars = true`**. Without that (or `--keep-vars`), `wrangler deploy` **deletes** dashboard plaintext Variables, then applies only config `[vars]`. **Secrets are never deleted** by deploy.

## Workers Builds — paste these exact commands

Dashboard → Worker **`totebird`** → Settings → **Build**:

| Setting | Exact value |
|---|---|
| **Root directory** | *(leave empty / repo root — not `workers/files-b2`)* |
| **Build command** | `npm run build:cf` |
| **Deploy command** | `npx opennextjs-cloudflare deploy -- --keep-vars` |

Equivalents that also work:

```bash
# Build (produces .open-next/ — plain `npm run build` / `next build` is NOT enough)
npx @opennextjs/cloudflare build
# or: npm run build:cf

# Deploy (keep_vars so dashboard Variables are not wiped)
npx opennextjs-cloudflare deploy -- --keep-vars
# or: npm run deploy:cf
```

**Do not** leave Deploy as bare `npx wrangler deploy` unless Build already ran OpenNext. Wrangler will call `opennextjs-cloudflare deploy`, then fail with:

> Could not find compiled Open Next config, did you run the build command?

Local one-shot (build + deploy): `npm run build:cf && npm run deploy:cf`.

## Immediate: re-add wiped keys as Secrets

### A) App Worker `totebird`

Cloudflare dashboard → Workers → **`totebird`** → Settings → **Variables and Secrets**.

**Prefer Secret** for everything except true public values:

| Kind | Keys |
|---|---|
| **Secret** | `DATABASE_URL`, `CLERK_SECRET_KEY`, `B2_APPLICATION_KEY`, `B2_KEY_ID`, `B2_BUCKET`, `B2_ENDPOINT`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, Stripe price IDs, `CRON_SECRET`, `FILES_CDN_CHECK_SECRET`, `ADMIN_EMAIL`, `CLERK_WEBHOOK_SECRET` (if used) |
| **Variable** (or Secret) | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CLERK_*`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_FILES_BASE_URL`, `STRIPE_CONNECT_ENABLED`, `STRIPE_PLATFORM_FEE_BPS`, `RESEND_FROM_EMAIL` |

Also set the same `NEXT_PUBLIC_*` under **Workers Builds → Build variables and secrets** so the Next build can inline them ([OpenNext env docs](https://opennext.js.org/cloudflare/howtos/env-vars)).

### B) Files Worker `totebird-files-b2`

Workers → **`totebird-files-b2`** → Variables and Secrets:

| Kind | Keys |
|---|---|
| **Secret** | `B2_APPLICATION_KEY`, `FILES_CDN_CHECK_SECRET`, and preferably `TOTEBIRD_APP_ORIGIN`, `B2_APPLICATION_KEY_ID`, `B2_ENDPOINT`, `BUCKET_NAME` |

## Why #48 / #50 were not enough alone

- PR #48 only patched `workers/files-b2`. Merging layout PR #49 still ran **Workers Builds: totebird** without root `keep_vars` and wiped app plaintext Variables.
- PR #50 added root `keep_vars` + OpenNext packages, but the dashboard **Build command** was still `npm run build` (`next build` only). Deploy then failed looking for `.open-next/`.
