import "server-only";

import {
  appUrl,
  hasClerkPublishable,
  isDemoModeForced,
} from "@/lib/env-public";

export { appUrl, hasClerkPublishable, isDemoModeForced };

function truthy(v: string | undefined) {
  return v === "1" || v === "true" || v === "yes";
}

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

/** Full Clerk pair (publishable + secret). Server-only — never import from client. */
export function hasClerk() {
  return Boolean(
    hasClerkPublishable() && process.env.CLERK_SECRET_KEY,
  );
}

/** Shared Backblaze B2 bucket (S3-compatible). Soft-fails when unset. */
export function hasB2() {
  return Boolean(
    process.env.B2_KEY_ID &&
      process.env.B2_APPLICATION_KEY &&
      process.env.B2_BUCKET &&
      process.env.B2_ENDPOINT,
  );
}

/** @deprecated Prefer hasB2() — R2 is no longer used. */
export function hasR2() {
  return hasB2();
}

export function hasResend() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function hasStripe() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Express Connect + Direct invoice charges (off until Dashboard + flag). */
export function isStripeConnectEnabled() {
  return truthy(process.env.STRIPE_CONNECT_ENABLED) && hasStripe();
}

/**
 * Platform fee on Free-plan Connect invoice Checkout, in basis points.
 * Default 100 = 1% when Connect is enabled and env unset.
 * Solo/Studio ignore this (0 fee in applicationFeeCents).
 */
export function platformFeeBps() {
  const raw = process.env.STRIPE_PLATFORM_FEE_BPS;
  if (raw === undefined || raw === "") return 100;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 100;
}

export function isDemoMode() {
  if (isDemoModeForced()) return true;
  return !hasDatabase() || !hasClerk();
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function adminUserIds(): string[] {
  return (process.env.ADMIN_USER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function maxUploadBytes() {
  const n = Number(
    process.env.B2_MAX_UPLOAD_BYTES || process.env.R2_MAX_UPLOAD_BYTES,
  );
  return Number.isFinite(n) && n > 0 ? n : 10 * 1024 * 1024;
}

export function integrationStatus() {
  return {
    demoMode: isDemoMode(),
    database: hasDatabase(),
    clerk: hasClerk(),
    b2: hasB2(),
    /** @deprecated alias of b2 */
    r2: hasB2(),
    resend: hasResend(),
    stripe: hasStripe(),
    stripeConnect: isStripeConnectEnabled(),
  };
}
