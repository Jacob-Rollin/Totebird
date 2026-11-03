-- Studio custom domains (v1 DNS readiness — host mapping later)
DO $$ BEGIN
  CREATE TYPE "public"."custom_domain_status" AS ENUM('pending', 'verified', 'failed', 'disabled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "custom_domains" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "hostname" text NOT NULL,
  "status" "custom_domain_status" DEFAULT 'pending' NOT NULL,
  "verification_token" text NOT NULL,
  "last_checked_at" timestamp with time zone,
  "verified_at" timestamp with time zone,
  "status_detail" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "custom_domains" ADD CONSTRAINT "custom_domains_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "custom_domains_hostname_idx" ON "custom_domains" USING btree ("hostname");
CREATE UNIQUE INDEX IF NOT EXISTS "custom_domains_user_id_idx" ON "custom_domains" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "custom_domains_status_idx" ON "custom_domains" USING btree ("status");
