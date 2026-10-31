-- Stripe Billing subscription id + Connect Express fields (phone-friendly Neon SQL)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_connect_account_id" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_connect_charges_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_connect_details_submitted" boolean DEFAULT false NOT NULL;

-- Lookup Connect webhooks by acct_… (NULLs allowed multiple times in Postgres unique index)
CREATE UNIQUE INDEX IF NOT EXISTS "users_stripe_connect_account_id_idx"
  ON "users" ("stripe_connect_account_id");
