import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const planEnum = pgEnum("plan", ["free", "solo", "studio"]);
export const linkTypeEnum = pgEnum("link_type", ["checklist", "invoice"]);
export const linkStatusEnum = pgEnum("link_status", [
  "active",
  "completed",
  "closed",
  "archived",
  "disabled",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "open",
  "paid",
  "overdue",
  "void",
]);
export const itemTypeEnum = pgEnum("item_type", [
  "checkbox",
  "text",
  "file",
]);
export const feedbackTypeEnum = pgEnum("feedback_type", ["bug", "suggestion"]);
export const feedbackStatusEnum = pgEnum("feedback_status", [
  "new",
  "triaged",
  "planned",
  "done",
  "wontfix",
]);
export const feedbackPriorityEnum = pgEnum("feedback_priority", [
  "low",
  "normal",
  "high",
]);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    clerkId: text("clerk_id").notNull(),
    email: text("email").notNull(),
    name: text("name"),
    plan: planEnum("plan").notNull().default("free"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    /** Stripe Connect Express account id (acct_…) — Phase 2+ */
    stripeConnectAccountId: text("stripe_connect_account_id"),
    stripeConnectChargesEnabled: boolean("stripe_connect_charges_enabled")
      .notNull()
      .default(false),
    stripeConnectDetailsSubmitted: boolean("stripe_connect_details_submitted")
      .notNull()
      .default(false),
    disabled: boolean("disabled").notNull().default(false),
    flagged: boolean("flagged").notNull().default(false),
    flagReason: text("flag_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("users_clerk_id_idx").on(t.clerkId),
    uniqueIndex("users_email_idx").on(t.email),
  ],
);

export const links = pgTable(
  "links",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    type: linkTypeEnum("type").notNull(),
    token: text("token").notNull(),
    title: text("title").notNull(),
    clientEmail: text("client_email"),
    status: linkStatusEnum("status").notNull().default("active"),
    templateKey: text("template_key"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("links_token_idx").on(t.token),
    index("links_user_id_idx").on(t.userId),
    index("links_status_idx").on(t.status),
  ],
);

export const checklistItems = pgTable(
  "checklist_items",
  {
    id: text("id").primaryKey(),
    linkId: text("link_id")
      .notNull()
      .references(() => links.id),
    label: text("label").notNull(),
    itemType: itemTypeEnum("item_type").notNull().default("checkbox"),
    required: boolean("required").notNull().default(true),
    done: boolean("done").notNull().default(false),
    answerText: text("answer_text"),
    position: integer("position").notNull().default(0),
    doneAt: timestamp("done_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("checklist_items_link_id_idx").on(t.linkId)],
);

export const files = pgTable(
  "files",
  {
    id: text("id").primaryKey(),
    linkId: text("link_id")
      .notNull()
      .references(() => links.id),
    checklistItemId: text("checklist_item_id").references(
      () => checklistItems.id,
    ),
    filename: text("filename").notNull(),
    contentType: text("content_type"),
    sizeBytes: integer("size_bytes").notNull().default(0),
    storageKey: text("storage_key").notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("files_link_id_idx").on(t.linkId)],
);

export const invoices = pgTable(
  "invoices",
  {
    id: text("id").primaryKey(),
    linkId: text("link_id")
      .notNull()
      .references(() => links.id),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    description: text("description"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    status: invoiceStatusEnum("status").notNull().default("open"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    paidManually: boolean("paid_manually").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("invoices_link_id_idx").on(t.linkId),
    index("invoices_status_idx").on(t.status),
  ],
);

export const invoiceLineItems = pgTable(
  "invoice_line_items",
  {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitAmountCents: integer("unit_amount_cents").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("invoice_line_items_invoice_id_idx").on(t.invoiceId)],
);

export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    linkId: text("link_id").references(() => links.id),
    userId: text("user_id").references(() => users.id),
    type: text("type").notNull(),
    meta: text("meta"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("events_link_id_idx").on(t.linkId),
    index("events_user_id_idx").on(t.userId),
  ],
);

export const feedback = pgTable(
  "feedback",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id),
    type: feedbackTypeEnum("type").notNull(),
    body: text("body").notNull(),
    pageUrl: text("page_url"),
    status: feedbackStatusEnum("status").notNull().default("new"),
    priority: feedbackPriorityEnum("priority").notNull().default("normal"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("feedback_user_id_idx").on(t.userId),
    index("feedback_status_idx").on(t.status),
    index("feedback_type_idx").on(t.type),
    index("feedback_created_at_idx").on(t.createdAt),
  ],
);

export type User = typeof users.$inferSelect;
export type Link = typeof links.$inferSelect;
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type FileRow = typeof files.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
