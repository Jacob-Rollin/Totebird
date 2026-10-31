#!/usr/bin/env node
/**
 * Env checklist — prints SET / MISSING for known keys (never prints values).
 * Mirrors src/lib/env.ts flags. Exit 0 always (informational checklist).
 *
 * Usage: npm run prove:env
 * Loads .env.local then .env (same as prove-db).
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

function truthy(v) {
  return v === "1" || v === "true" || v === "yes";
}

function present(name) {
  const v = process.env[name];
  return Boolean(v && String(v).trim());
}

function mark(name) {
  return present(name) ? "SET    " : "MISSING";
}

const groups = [
  {
    title: "App",
    keys: ["NEXT_PUBLIC_APP_URL", "ADMIN_EMAIL", "ADMIN_USER_IDS", "DEMO_MODE"],
  },
  {
    title: "Neon (Postgres)",
    keys: ["DATABASE_URL", "DATABASE_URL_UNPOOLED"],
    note: "Production: set on Netlify. Local db:push / prove:db only when you run on a laptop later.",
  },
  {
    title: "Clerk",
    keys: [
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
      "CLERK_SECRET_KEY",
      "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
      "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
      "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL",
      "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL",
      "CLERK_WEBHOOK_SECRET",
    ],
    needBoth: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"],
  },
  {
    title: "Backblaze B2 (shared bucket)",
    keys: [
      "B2_KEY_ID",
      "B2_APPLICATION_KEY",
      "B2_BUCKET",
      "B2_ENDPOINT",
      "B2_REGION",
      "NEXT_PUBLIC_FILES_BASE_URL",
      "B2_MAX_UPLOAD_BYTES",
    ],
    needAll: [
      "B2_KEY_ID",
      "B2_APPLICATION_KEY",
      "B2_BUCKET",
      "B2_ENDPOINT",
    ],
  },
  {
    title: "Resend",
    keys: ["RESEND_API_KEY", "RESEND_FROM_EMAIL"],
  },
  {
    title: "Stripe",
    keys: [
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      "STRIPE_PRICE_SOLO_MONTHLY",
      "STRIPE_PRICE_SOLO_YEARLY",
      "STRIPE_PRICE_STUDIO_MONTHLY",
      "STRIPE_PRICE_STUDIO_YEARLY",
      "STRIPE_CONNECT_ENABLED",
      "STRIPE_PLATFORM_FEE_BPS",
    ],
    note: "Connect stays off until Dashboard setup + STRIPE_CONNECT_ENABLED=true.",
  },
  {
    title: "Cron / Netlify reminders",
    keys: ["CRON_SECRET"],
    note: "Leave unset for local smoke; set on Netlify production.",
  },
];

console.log("Totebird env checklist (values never printed)\n");

for (const g of groups) {
  console.log(`## ${g.title}`);
  if (g.note) console.log(`   ${g.note}`);
  for (const key of g.keys) {
    console.log(`  ${mark(key)}  ${key}`);
  }
  if (g.needBoth) {
    const [a, b] = g.needBoth;
    const pa = present(a);
    const pb = present(b);
    if (pa !== pb) {
      console.log(`   ⚠ partial: need BOTH ${a} and ${b}`);
    }
  }
  if (g.needAll) {
    const states = g.needAll.map(present);
    const some = states.some(Boolean);
    const all = states.every(Boolean);
    if (some && !all) {
      console.log(`   ⚠ partial B2 core: need ${g.needAll.join(", ")}`);
    }
  }
  console.log("");
}

const hasDatabase = present("DATABASE_URL");
const hasClerk =
  present("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") && present("CLERK_SECRET_KEY");
const hasB2 =
  present("B2_KEY_ID") &&
  present("B2_APPLICATION_KEY") &&
  present("B2_BUCKET") &&
  present("B2_ENDPOINT");
const hasResend = present("RESEND_API_KEY");
const hasStripe = present("STRIPE_SECRET_KEY");
const stripeConnect =
  truthy(process.env.STRIPE_CONNECT_ENABLED) && hasStripe;
const demoMode = truthy(process.env.DEMO_MODE) || !hasDatabase || !hasClerk;

console.log("## Derived (src/lib/env.ts)");
console.log(`  demoMode       ${demoMode}`);
console.log(`  hasDatabase    ${hasDatabase}`);
console.log(`  hasClerk       ${hasClerk}`);
console.log(`  hasB2          ${hasB2}`);
console.log(`  hasResend      ${hasResend}`);
console.log(`  hasStripe      ${hasStripe}`);
console.log(`  stripeConnect  ${stripeConnect}`);
console.log("");
console.log(
  demoMode
    ? "App will run in DEMO MODE (in-memory) until Neon + Clerk are both set."
    : "Neon + Clerk present — live mode (unless DEMO_MODE forces demo).",
);
console.log("Done. Exit 0 (checklist only).");
