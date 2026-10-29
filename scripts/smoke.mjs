#!/usr/bin/env node
/**
 * Minimal smoke test against a running server (default http://127.0.0.1:3000).
 * Usage: node scripts/smoke.mjs [baseUrl]
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

let failed = 0;
for (const path of paths) {
  const url = `${base}${path}`;
  const headers = {};
  if (path === "/api/cron/reminders" && cronSecret) {
    headers.Authorization = `Bearer ${cronSecret}`;
  }
  try {
    const res = await fetch(url, { redirect: "manual", headers });
    const ok = res.status >= 200 && res.status < 400;
    console.log(`${ok ? "OK" : "FAIL"} ${res.status} ${path}`);
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
