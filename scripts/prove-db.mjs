#!/usr/bin/env node
/**
 * End-to-end DB proof against DATABASE_URL (from .env.local after neon env pull).
 * Creates a throwaway users row, reads it back, deletes it.
 */
import { config } from "dotenv";
import { randomBytes } from "crypto";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("FAIL: DATABASE_URL is not set. Run: neon login && neon env pull");
  process.exit(1);
}

const sql = neon(url);
const id = `usr_prove_${randomBytes(6).toString("hex")}`;
const clerkId = `user_prove_${randomBytes(4).toString("hex")}`;
const email = `prove-${Date.now()}@totebird.test`;

try {
  const ping = await sql`select 1 as ok`;
  console.log("OK ping", ping[0]);

  await sql`
    insert into users (id, clerk_id, email, name, plan, disabled, flagged)
    values (${id}, ${clerkId}, ${email}, 'Prove Script', 'free', false, false)
  `;
  console.log("OK insert", id);

  const rows = await sql`select id, email, plan from users where id = ${id}`;
  if (!rows.length || rows[0].email !== email) {
    throw new Error("read-back mismatch");
  }
  console.log("OK select", rows[0]);

  await sql`delete from users where id = ${id}`;
  console.log("OK delete", id);
  console.log("\nDATABASE_URL wired — Postgres read/write proved.");
} catch (err) {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  console.error(
    "If relation missing, run: npm run db:push  (with DATABASE_URL set)",
  );
  process.exit(1);
}
