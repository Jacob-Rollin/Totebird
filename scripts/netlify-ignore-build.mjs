#!/usr/bin/env node
/**
 * Netlify production build ignore helper.
 *
 * Exit 0 → skip this build (no deploy credits burned).
 * Exit 1 → proceed with build.
 *
 * Skips only when every changed file looks like docs / markdown / repo noise
 * that cannot affect the running Next.js app. Any src/, public/, config,
 * lockfile, or netlify/ change always proceeds.
 *
 * Deploy Preview / branch contexts use `ignore = "exit 0"` in netlify.toml
 * and never reach this script.
 */

import { execSync } from "node:child_process";

const base = process.env.CACHED_COMMIT_REF;
const tip = process.env.COMMIT_REF || "HEAD";

/** Paths that never warrant a production Netlify rebuild by themselves. */
const SKIPPABLE = [
  /^README\.md$/i,
  /^LICENSE(\b|$)/i,
  /^CHANGELOG\.md$/i,
  /^CONTRIBUTING\.md$/i,
  /^AGENTS\.md$/i,
  /^CODE_OF_CONDUCT\.md$/i,
  /^\.gitignore$/,
  /^\.gitattributes$/,
  /^\.editorconfig$/,
  /^\.github\//,
  /^\.cursor\//,
  /^docs\//,
  /^.*\.md$/i,
  /^.*\.mdx$/i,
];

function proceed(reason) {
  console.log(`[netlify-ignore] proceed — ${reason}`);
  process.exit(1);
}

function skip(reason) {
  console.log(`[netlify-ignore] skip — ${reason}`);
  process.exit(0);
}

if (!base) {
  proceed("no CACHED_COMMIT_REF (first build or cleared cache)");
}

if (base === tip) {
  proceed("CACHED_COMMIT_REF equals COMMIT_REF");
}

let names;
try {
  const out = execSync(`git diff --name-only ${base} ${tip}`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  names = out
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
} catch (err) {
  proceed(
    `git diff failed (${err instanceof Error ? err.message : "unknown"})`,
  );
}

if (names.length === 0) {
  skip(`no file changes between ${base.slice(0, 7)} and ${tip.slice(0, 7)}`);
}

const blockers = names.filter(
  (file) => !SKIPPABLE.some((re) => re.test(file)),
);

if (blockers.length === 0) {
  skip(
    `only docs/markdown/noise changed (${names.length} file(s)): ${names.join(", ")}`,
  );
}

proceed(
  `${blockers.length} app-relevant change(s): ${blockers.slice(0, 8).join(", ")}${blockers.length > 8 ? "…" : ""}`,
);
