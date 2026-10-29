CREATE TYPE "public"."plan" AS ENUM('free', 'solo', 'studio');
CREATE TYPE "public"."link_type" AS ENUM('checklist', 'invoice');
CREATE TYPE "public"."link_status" AS ENUM('active', 'completed', 'closed', 'disabled');
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'open', 'paid', 'overdue', 'void');

CREATE TABLE "users" (
  "id" text PRIMARY KEY NOT NULL,
  "clerk_id" text NOT NULL,
  "email" text NOT NULL,
  "name" text,
  "plan" "plan" DEFAULT 'free' NOT NULL,
  "disabled" boolean DEFAULT false NOT NULL,
  "flagged" boolean DEFAULT false NOT NULL,
  "flag_reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "users_clerk_id_idx" ON "users" USING btree ("clerk_id");
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");

CREATE TABLE "links" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "type" "link_type" NOT NULL,
  "token" text NOT NULL,
  "title" text NOT NULL,
  "client_email" text,
  "status" "link_status" DEFAULT 'active' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "closed_at" timestamp with time zone,
  CONSTRAINT "links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);
CREATE UNIQUE INDEX "links_token_idx" ON "links" USING btree ("token");
CREATE INDEX "links_user_id_idx" ON "links" USING btree ("user_id");
CREATE INDEX "links_status_idx" ON "links" USING btree ("status");

CREATE TABLE "checklist_items" (
  "id" text PRIMARY KEY NOT NULL,
  "link_id" text NOT NULL,
  "label" text NOT NULL,
  "done" boolean DEFAULT false NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "done_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "checklist_items_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE no action ON UPDATE no action
);
CREATE INDEX "checklist_items_link_id_idx" ON "checklist_items" USING btree ("link_id");

CREATE TABLE "files" (
  "id" text PRIMARY KEY NOT NULL,
  "link_id" text NOT NULL,
  "checklist_item_id" text,
  "filename" text NOT NULL,
  "content_type" text,
  "size_bytes" integer DEFAULT 0 NOT NULL,
  "storage_key" text NOT NULL,
  "uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "files_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "files_checklist_item_id_checklist_items_id_fk" FOREIGN KEY ("checklist_item_id") REFERENCES "public"."checklist_items"("id") ON DELETE no action ON UPDATE no action
);
CREATE INDEX "files_link_id_idx" ON "files" USING btree ("link_id");

CREATE TABLE "invoices" (
  "id" text PRIMARY KEY NOT NULL,
  "link_id" text NOT NULL,
  "amount_cents" integer NOT NULL,
  "currency" text DEFAULT 'usd' NOT NULL,
  "description" text,
  "due_at" timestamp with time zone,
  "status" "invoice_status" DEFAULT 'open' NOT NULL,
  "stripe_checkout_session_id" text,
  "stripe_payment_intent_id" text,
  "paid_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "invoices_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE no action ON UPDATE no action
);
CREATE UNIQUE INDEX "invoices_link_id_idx" ON "invoices" USING btree ("link_id");
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");

CREATE TABLE "events" (
  "id" text PRIMARY KEY NOT NULL,
  "link_id" text,
  "user_id" text,
  "type" text NOT NULL,
  "meta" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "events_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);
CREATE INDEX "events_link_id_idx" ON "events" USING btree ("link_id");
CREATE INDEX "events_user_id_idx" ON "events" USING btree ("user_id");
