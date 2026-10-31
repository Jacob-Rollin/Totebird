# `totebird-files-b2` — Cloudflare Worker for private B2

Serves checklist file **downloads** at `https://files.totebird.com/<object-key>` from a **private** Backblaze B2 bucket using AWS SigV4 (`aws4fetch`).

**Uploads are not handled here.** The Next.js app still issues short-lived **presigned PUT** URLs straight to B2. This Worker only accepts **GET** and **HEAD** (405 otherwise).

Based on the official sample: [backblaze-b2-samples/cloudflare-b2](https://github.com/backblaze-b2-samples/cloudflare-b2).

Phone clickpath (dashboard + secrets + custom domain + Netlify):  
Project store doc `docs/cloudflare-b2-files-worker.md`.

## Deploy

1. Edit `wrangler.toml` `[vars]`:
   - `B2_APPLICATION_KEY_ID` — key ID (Netlify name: `B2_KEY_ID`)
   - `B2_ENDPOINT` — host only, e.g. `s3.us-west-004.backblazeb2.com`
   - `BUCKET_NAME` — exact bucket (placeholder in `wrangler.toml`: `your-b2-bucket-name`; override with the real name in the Cloudflare dashboard / `wrangler` — never commit the Netlify `B2_BUCKET` value)
   - leave `ALLOW_LIST_BUCKET` / `RCLONE_DOWNLOAD` as `false`
2. In B2 → Bucket Settings → Bucket Info set  
   `{"Cache-Control":"public, max-age=86400"}` so Cloudflare can cache signed upstream responses.
3. Install and deploy:

```bash
cd workers/files-b2
npm install
npx wrangler login
echo "<applicationKey>" | npx wrangler secret put B2_APPLICATION_KEY
npx wrangler deploy
```

4. Cloudflare dashboard → this Worker → **Custom Domains** → add `files.totebird.com` (orange-proxied).
5. After a known object key returns 200, set Netlify  
   `NEXT_PUBLIC_FILES_BASE_URL=https://files.totebird.com` and redeploy the app.

## Secrets / vars

| Kind | Name | Notes |
|---|---|---|
| Secret | `B2_APPLICATION_KEY` | applicationKey — never commit |
| Var | `B2_APPLICATION_KEY_ID` | keyID |
| Var | `B2_ENDPOINT` | host only (no `https://`) |
| Var | `BUCKET_NAME` | bucket name, not `$path` |
| Var | `ALLOW_LIST_BUCKET` | `false` |
| Var | `RCLONE_DOWNLOAD` | `false` |

## Test

```bash
curl -sI "https://files.totebird.com/users/.../your-object-key"
```

Expect `200` for a real key. Root `/` should 404 with listing disabled.
