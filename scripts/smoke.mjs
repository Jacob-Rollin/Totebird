#!/usr/bin/env node
/**
 * Minimal smoke test against a running server (default http://127.0.0.1:3000).
 * Usage: node scripts/smoke.mjs [baseUrl]
 *
 * Critical paths (/c/demo-checklist, /i/demo-invoice, /app) must not return
 * Next.js "Application error" HTML — covers Clerk+DATABASE_URL live mode where
 * seeded demo tokens still come from demo-store.
 *
 * If CRON_SECRET is set in the environment, /api/cron/reminders is called with
 * Authorization: Bearer … (avoids false 401 failures).
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const base = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/$/, "");
const cronSecret = process.env.CRON_SECRET?.trim() || "";

const paths = [
  "/",
  "/demo",
  "/privacy",
  "/terms",
  "/c/demo-checklist",
  "/i/demo-invoice",
  "/i/demo-invoice/print",
  "/app",
  "/app/billing",
  "/app/billing?upgraded=1",
  "/app/billing?upgraded=1&session_id=cs_test_smoke",
  "/app/settings",
  "/app/links/new",
  "/api/cron/reminders",
  "/admin",
  "/admin/users",
  "/admin/links",
  "/admin/invoices",
  "/brand/wordmark-slate-orange.png",
  "/favicon.ico",
];

/** Routes that previously 500'd when Clerk + DATABASE_URL were set. */
const mustNotAppError = new Set([
  "/",
  "/c/demo-checklist",
  "/i/demo-invoice",
  "/i/demo-invoice/print",
  "/app",
  "/app/billing",
  "/app/billing?upgraded=1",
  "/app/billing?upgraded=1&session_id=cs_test_smoke",
  "/demo",
]);

let failed = 0;
for (const path of paths) {
  const url = `${base}${path}`;
  const headers = {};
  if (path === "/api/cron/reminders" && cronSecret) {
    headers.Authorization = `Bearer ${cronSecret}`;
  }
  try {
    const res = await fetch(url, { redirect: "manual", headers });
    // 3xx (e.g. /app → /sign-in when Clerk live mode, signed out) is fine.
    const redirected = res.status >= 300 && res.status < 400;
    const body =
      mustNotAppError.has(path) && !redirected ? await res.text() : "";
    const appErr =
      Boolean(body) && /Application error|id="__next_error__"/i.test(body);
    const ok = res.status >= 200 && res.status < 400 && !appErr;
    console.log(
      `${ok ? "OK" : "FAIL"} ${res.status} ${path}${appErr ? " (application error)" : ""}`,
    );
    if (!ok) failed++;
  } catch (e) {
    console.log(`FAIL 000 ${path} (${e.message})`);
    failed++;
  }
}

if (failed) {
  console.error(`\n${failed} route(s) failed`);
  process.exit(1);
}
console.log(`\nAll ${paths.length} routes OK against ${base}`);
