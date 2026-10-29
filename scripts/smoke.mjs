#!/usr/bin/env node
/**
 * Minimal smoke test against a running server (default http://127.0.0.1:3000).
 * Usage: node scripts/smoke.mjs [baseUrl]
 */
const base = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/$/, "");

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
  "/app/links/new",
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
  try {
    const res = await fetch(url, { redirect: "manual" });
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
