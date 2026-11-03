# `totebird-files-b2` — Cloudflare Worker for private B2

Serves checklist file **downloads** at `https://files.totebird.com/<object-key>` from a **private** Backblaze B2 bucket using AWS SigV4 (`aws4fetch`).

**Uploads are not handled here.** The Next.js app still issues short-lived **presigned PUT** URLs straight to B2. This Worker only accepts **GET** and **HEAD** (405 otherwise).

**Revoke-on-close:** keys look like `users/{userId}/links/{linkId}/…`. Before streaming, the Worker calls the app (`GET /api/internal/cdn-access?linkId=…`) with a shared secret. If the link is closed, archived, or disabled, the Worker returns **403**. Responses use `Cache-Control: private, no-store` so edge cache does not keep serving after close. Freelancer dashboard downloads use `/api/files/[id]/download` (signed B2) and still work after close until hard-delete.

Based on the official sample: [backblaze-b2-samples/cloudflare-b2](https://github.com/backblaze-b2-samples/cloudflare-b2).

Phone clickpath (dashboard + secrets + custom domain + Netlify):  
Project store doc `docs/cloudflare-b2-files-worker.md`.

## Deploy

1. Edit `wrangler.toml` `[vars]`:
   - `B2_APPLICATION_KEY_ID` — key ID (Netlify name: `B2_KEY_ID`)
   - `B2_ENDPOINT` — host only, e.g. `s3.us-west-004.backblazeb2.com`
   - `BUCKET_NAME` — exact bucket (placeholder in `wrangler.toml`: `your-b2-bucket-name`; override with the real name in the Cloudflare dashboard / `wrangler` — never commit the Netlify `B2_BUCKET` value)
   - `TOTEBIRD_APP_ORIGIN` — `https://www.totebird.com` (no trailing slash)
   - leave `ALLOW_LIST_BUCKET` / `RCLONE_DOWNLOAD` as `false`
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
4. On the app host set `FILES_CDN_CHECK_SECRET` (same value) and optionally  
   `NEXT_PUBLIC_FILES_BASE_URL=https://files.totebird.com`, then redeploy.

## Secrets / vars

| Kind | Name | Notes |
|---|---|---|
| Secret | `B2_APPLICATION_KEY` | applicationKey — never commit |
| Secret | `FILES_CDN_CHECK_SECRET` | shared with app `FILES_CDN_CHECK_SECRET` |
| Var | `B2_APPLICATION_KEY_ID` | keyID |
| Var | `B2_ENDPOINT` | host only (no `https://`) |
| Var | `BUCKET_NAME` | bucket name, not `$path` |
| Var | `TOTEBIRD_APP_ORIGIN` | app origin for status checks |
| Var | `ALLOW_LIST_BUCKET` | `false` |
| Var | `RCLONE_DOWNLOAD` | `false` |

## Test

```bash
curl -sI "https://files.totebird.com/users/.../links/.../your-object-key"
```

Expect `200` for an **active** link’s real key; after **Close**, the same URL should be `403`. Root `/` should 404 with listing disabled. Owner download via `/api/files/{id}/download` should still work after close.
