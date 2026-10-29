/**
 * Edge- and client-safe env helpers.
 * Do NOT read CLERK_SECRET_KEY, DATABASE_URL, ADMIN_EMAIL, or other secrets here —
 * those belong in `@/lib/env` (server-only). Referencing secret env names in a
 * module imported by middleware/client can embed their values in scanned bundles.
 */

function truthy(v: string | undefined) {
  return v === "1" || v === "true" || v === "yes";
}

/** Publishable Clerk key only — safe for layout / middleware gating. */
export function hasClerkPublishable() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

export function isDemoModeForced() {
  return truthy(process.env.DEMO_MODE);
}

export function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

/**
 * Prefer the request Host (www vs apex vs netlify.app) for Checkout/Portal
 * return URLs so a stale NEXT_PUBLIC_APP_URL cannot strand users on the wrong
 * host after Solo upgrade. Falls back to appUrl().
 */
export function originFromRequest(req: Request): string {
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  const host =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    req.headers.get("host")?.trim();
  if (host) return `${proto}://${host}`.replace(/\/$/, "");
  return appUrl();
}
