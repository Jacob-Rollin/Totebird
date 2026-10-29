function truthy(v: string | undefined) {
  return v === "1" || v === "true" || v === "yes";
}

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function hasClerk() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY,
  );
}

export function hasR2() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME,
  );
}

export function hasResend() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function hasStripe() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function isDemoMode() {
  if (truthy(process.env.DEMO_MODE)) return true;
  return !hasDatabase() || !hasClerk();
}

export function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
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
  const n = Number(process.env.R2_MAX_UPLOAD_BYTES);
  return Number.isFinite(n) && n > 0 ? n : 10 * 1024 * 1024;
}

export function integrationStatus() {
  return {
    demoMode: isDemoMode(),
    database: hasDatabase(),
    clerk: hasClerk(),
    r2: hasR2(),
    resend: hasResend(),
    stripe: hasStripe(),
  };
}
