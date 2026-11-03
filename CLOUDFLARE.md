# Cloudflare Workers — env vars that survive deploy

Two Workers on the Totebird account. They do **not** share Variables.

| Worker | Repo config | How it deploys |
|---|---|---|
| **`totebird`** (Next.js app) | root [`wrangler.jsonc`](./wrangler.jsonc) | Workers Builds on `main` (and `npm run deploy:cf`) |
| **`totebird-files-b2`** (CDN) | [`workers/files-b2/wrangler.toml`](./workers/files-b2/wrangler.toml) | Manual `cd workers/files-b2 && npm run deploy` |

Both set **`keep_vars = true`**. Without that (or `--keep-vars`), `wrangler deploy` **deletes** dashboard plaintext Variables, then applies only config `[vars]`. **Secrets are never deleted** by deploy.

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

## Workers Builds deploy command (required)

Dashboard → Worker **`totebird`** → Settings → **Build** → **Deploy command**:

```bash
npx opennextjs-cloudflare deploy -- --keep-vars
```

or:

```bash
npm run deploy:cf
```

`keep_vars` in `wrangler.jsonc` should be enough; the CLI flag is belt-and-suspenders if a build step regenerates config without the flag.

**Root directory:** repo root (not `workers/files-b2`).

## Why #48 was not enough

PR #48 only patched `workers/files-b2`. Merging layout PR #49 still ran **Workers Builds: totebird**, which redeployed the **app** Worker with default `wrangler deploy` (no `keep_vars` in root config yet) and wiped that Worker’s plaintext Variables again.
