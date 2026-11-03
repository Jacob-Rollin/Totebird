# `totebird-files-b2` — Cloudflare Worker for private B2

Serves checklist file **downloads** at `https://files.totebird.com/<object-key>` from a **private** Backblaze B2 bucket using AWS SigV4 (`aws4fetch`).

**Uploads are not handled here.** The Next.js app still issues short-lived **presigned PUT** URLs straight to B2. This Worker only accepts **GET** and **HEAD** (405 otherwise).

**Revoke-on-close:** keys look like `users/{userId}/links/{linkId}/…`. Before streaming, the Worker calls the app (`GET /api/internal/cdn-access?linkId=…`) with a shared secret. If the link is closed, archived, or disabled, the Worker returns **403**. Responses use `Cache-Control: private, no-store` so edge cache does not keep serving after close. Freelancer dashboard downloads use `/api/files/[id]/download` (signed B2) and still work after close until hard-delete.

Based on the official sample: [backblaze-b2-samples/cloudflare-b2](https://github.com/backblaze-b2-samples/cloudflare-b2).

Phone clickpath (dashboard + secrets + custom domain + Netlify):  
Project store doc `docs/cloudflare-b2-files-worker.md`.

## Deploy

1. In Cloudflare → Worker `totebird-files-b2` → **Settings** → **Variables and Secrets**, set:

   | Kind | Name | Notes |
   |---|---|---|
   | Secret | `B2_APPLICATION_KEY` | applicationKey — never commit |
   | Secret | `FILES_CDN_CHECK_SECRET` | same random string as Netlify `FILES_CDN_CHECK_SECRET` |
   | Variable or Secret | `B2_APPLICATION_KEY_ID` | keyID (Netlify: `B2_KEY_ID`) |
   | Variable or Secret | `B2_ENDPOINT` | host only, e.g. `s3.us-west-004.backblazeb2.com` |
   | Variable or Secret | `BUCKET_NAME` | exact bucket — never commit the production name |
   | Variable or Secret | `TOTEBIRD_APP_ORIGIN` | `https://www.totebird.com` (no trailing slash) |

   Prefer **Secret** for anything you do not want wiped by a misconfigured deploy. Plain Variables are OK once `keep_vars = true` is in `wrangler.toml` (this repo).

2. Install and deploy:

```bash
cd workers/files-b2
npm install
npx wrangler login
echo "<applicationKey>" | npx wrangler secret put B2_APPLICATION_KEY
# Same random string as app host FILES_CDN_CHECK_SECRET
echo "<cdn-check-secret>" | npx wrangler secret put FILES_CDN_CHECK_SECRET
npx wrangler deploy
```

3. Cloudflare dashboard → this Worker → **Custom Domains** → add `files.totebird.com` (orange-proxied).
4. On the app host (Netlify) set `FILES_CDN_CHECK_SECRET` (same value) and optionally  
   `NEXT_PUBLIC_FILES_BASE_URL=https://files.totebird.com`, then redeploy.

### Why vars disappeared after deploy

By default `wrangler deploy` treats config as source of truth: it **deletes** dashboard plaintext Variables, then applies only `[vars]` from `wrangler.toml`. **Secrets are never deleted** by deploy.

This Worker sets `keep_vars = true` so dashboard-only Variables survive. Keys that *are* listed under `[vars]` still get overwritten on every deploy — that is why real B2 / origin values live in the dashboard (or as Secrets), not as committed placeholders.

## Secrets / vars

| Kind | Name | Survives `wrangler deploy`? | Notes |
|---|---|---|---|
| Secret | `B2_APPLICATION_KEY` | Always | applicationKey — never commit |
| Secret | `FILES_CDN_CHECK_SECRET` | Always | shared with app `FILES_CDN_CHECK_SECRET` |
| Var / Secret | `B2_APPLICATION_KEY_ID` | With `keep_vars` (or as Secret) | keyID |
| Var / Secret | `B2_ENDPOINT` | With `keep_vars` (or as Secret) | host only (no `https://`) |
| Var / Secret | `BUCKET_NAME` | With `keep_vars` (or as Secret) | bucket name, not `$path` |
| Var / Secret | `TOTEBIRD_APP_ORIGIN` | With `keep_vars` (or as Secret) | app origin for status checks |
| Var (in toml) | `ALLOW_LIST_BUCKET` | Yes (from toml) | `false` |
| Var (in toml) | `RCLONE_DOWNLOAD` | Yes (from toml) | `false` |

**App host note:** the Next.js site is on **Netlify**, not a Wrangler Worker. Netlify env vars are unrelated to this wipe. Only this files Worker is affected by `wrangler deploy`.

## Test

```bash
curl -sI "https://files.totebird.com/users/.../links/.../your-object-key"
```

Expect `200` for an **active** link’s real key; after **Close**, the same URL should be `403`. Root `/` should 404 with listing disabled. Owner download via `/api/files/{id}/download` should still work after close.
