ALTER TYPE "public"."link_status" ADD VALUE IF NOT EXISTS 'archived';
DO $$ BEGIN
  CREATE TYPE "public"."item_type" AS ENUM('checkbox', 'text', 'file');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_customer_id" text;

ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "template_key" text;

ALTER TABLE "checklist_items" ADD COLUMN IF NOT EXISTS "item_type" "item_type" DEFAULT 'checkbox' NOT NULL;
ALTER TABLE "checklist_items" ADD COLUMN IF NOT EXISTS "required" boolean DEFAULT true NOT NULL;
ALTER TABLE "checklist_items" ADD COLUMN IF NOT EXISTS "answer_text" text;

ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paid_manually" boolean DEFAULT false NOT NULL;

CREATE TABLE IF NOT EXISTS "invoice_line_items" (
  "id" text PRIMARY KEY NOT NULL,
  "invoice_id" text NOT NULL,
  "description" text NOT NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "unit_amount_cents" integer NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action
);
CREATE INDEX IF NOT EXISTS "invoice_line_items_invoice_id_idx" ON "invoice_line_items" USING btree ("invoice_id");
