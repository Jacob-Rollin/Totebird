import { and, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { demoStore, type CreateItemInput } from "@/db/demo-store";
import {
  changelogEntries,
  checklistItems,
  feedback,
  files,
  invoiceLineItems,
  invoices,
  links,
  users,
  type ChangelogEntry,
  type Feedback,
  type Invoice,
  type InvoiceLineItem,
  type Link,
  type User,
} from "@/db/schema";
import { hasDatabase, isDemoMode } from "@/lib/env";
import { newId, newToken } from "@/lib/ids";
import {
  checklistProgress,
  checklistRequiredComplete,
} from "@/lib/plans";

/** Seeded /demo link tokens — always served from demo-store, even in live mode. */
const SEEDED_DEMO_TOKENS = new Set(["demo-checklist", "demo-invoice"]);
const SEEDED_DEMO_LINK_IDS = new Set([
  "lnk_demo_checklist",
  "lnk_demo_invoice",
]);

export function isSeededDemoToken(token: string) {
  return SEEDED_DEMO_TOKENS.has(token);
}

function isSeededDemoLinkId(linkId: string) {
  return SEEDED_DEMO_LINK_IDS.has(linkId);
}

/**
 * When DATABASE_URL is set but Neon schema was never pushed (or the DB is
 * unreachable), mark the process as demo-fallback so /app and cron don't 500.
 */
let databaseUnusable = false;

function shouldUseDemoStore() {
  return databaseUnusable || isDemoMode() || !hasDatabase();
}

function noteDbFailure(err: unknown) {
  if (databaseUnusable) return;
  databaseUnusable = true;
  console.error(
    "[totebird] Database query failed; falling back to in-memory demo store for this process. Run `npm run db:push` when ready.",
    err,
  );
}

async function dbTry<T>(
  run: () => Promise<T>,
  fallback: () => T | Promise<T>,
): Promise<T> {
  if (shouldUseDemoStore()) return fallback();
  try {
    return await run();
  } catch (err) {
    noteDbFailure(err);
    return fallback();
  }
}

/** Probe Neon once — false when URL is set but schema/network isn't ready. */
export async function databaseLooksUsable(): Promise<boolean> {
  if (shouldUseDemoStore()) return false;
  try {
    await getDb().query.users.findFirst();
    return true;
  } catch (err) {
    noteDbFailure(err);
    return false;
  }
}

function demoForToken(token: string) {
  return shouldUseDemoStore() || isSeededDemoToken(token);
}

function demoForLink(linkId: string) {
  return shouldUseDemoStore() || isSeededDemoLinkId(linkId);
}

export async function ensureUser(input: {
  clerkId: string;
  email: string;
  name?: string | null;
}): Promise<User> {
  return dbTry(
    async () => {
      const db = getDb();
      const existing = await db.query.users.findFirst({
        where: eq(users.clerkId, input.clerkId),
      });
      if (existing) {
        if (existing.email !== input.email || existing.name !== input.name) {
          const [updated] = await db
            .update(users)
            .set({
              email: input.email,
              name: input.name ?? existing.name,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existing.id))
            .returning();
          return updated;
        }
        return existing;
      }
      const [created] = await db
        .insert(users)
        .values({
          id: newId("usr"),
          clerkId: input.clerkId,
          email: input.email,
          name: input.name ?? null,
        })
        .returning();
      return created;
    },
    () => demoStore.upsertUser(input),
  );
}

export async function getUserById(id: string) {
  return dbTry(
    async () =>
      (await getDb().query.users.findFirst({ where: eq(users.id, id) })) ?? null,
    () => demoStore.getUserById(id) ?? null,
  );
}

export async function getUserByClerkId(clerkId: string) {
  return dbTry(
    async () =>
      (await getDb().query.users.findFirst({
        where: eq(users.clerkId, clerkId),
      })) ?? null,
    () => demoStore.getUserByClerkId(clerkId) ?? null,
  );
}

/** Live billing path: always hit Neon when Clerk+DB are configured (never demo-store fallback). */
function isLiveBillingDb() {
  return hasDatabase() && !isDemoMode();
}

export async function getUserByStripeCustomerId(customerId: string) {
  if (!customerId) return null;
  if (!isLiveBillingDb()) {
    return (
      demoStore.getUsers().find((u) => u.stripeCustomerId === customerId) ?? null
    );
  }
  try {
    return (
      (await getDb().query.users.findFirst({
        where: eq(users.stripeCustomerId, customerId),
      })) ?? null
    );
  } catch (err) {
    noteDbFailure(err);
    return (
      demoStore.getUsers().find((u) => u.stripeCustomerId === customerId) ?? null
    );
  }
}

export async function getUserByIdBilling(id: string) {
  if (!id) return null;
  if (!isLiveBillingDb()) return demoStore.getUserById(id) ?? null;
  try {
    return (
      (await getDb().query.users.findFirst({ where: eq(users.id, id) })) ?? null
    );
  } catch (err) {
    noteDbFailure(err);
    return demoStore.getUserById(id) ?? null;
  }
}

export async function getUserByEmailBilling(email: string) {
  if (!email) return null;
  if (!isLiveBillingDb()) return demoStore.getUserByEmail(email) ?? null;
  try {
    return (
      (await getDb().query.users.findFirst({ where: eq(users.email, email) })) ??
      null
    );
  } catch (err) {
    noteDbFailure(err);
    return demoStore.getUserByEmail(email) ?? null;
  }
}

export type UserBillingPatch = Partial<
  Pick<User, "plan" | "stripeCustomerId" | "stripeSubscriptionId">
>;

/**
 * Persist Stripe plan fields. In live mode always writes Neon — never the
 * in-memory demo store — so a warm function that previously marked the DB
 * unusable cannot silently drop checkout.session.completed upgrades.
 */
export async function updateUserBilling(id: string, patch: UserBillingPatch) {
  if (!isLiveBillingDb()) return demoStore.updateUser(id, patch);
  const [updated] = await getDb()
    .update(users)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return updated ?? null;
}

export async function listUsers() {
  return dbTry(
    async () => {
      const db = getDb();
      return db
        .select({
          id: users.id,
          clerkId: users.clerkId,
          email: users.email,
          name: users.name,
          plan: users.plan,
          stripeCustomerId: users.stripeCustomerId,
          disabled: users.disabled,
          flagged: users.flagged,
          flagReason: users.flagReason,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          linkCount: count(links.id),
        })
        .from(users)
        .leftJoin(links, eq(links.userId, users.id))
        .groupBy(users.id)
        .orderBy(desc(users.createdAt));
    },
    () =>
      demoStore.getUsers().map((u) => ({
        ...u,
        linkCount: demoStore.getLinksByUser(u.id).length,
      })),
  );
}

export async function updateUserModeration(
  id: string,
  patch: Partial<
    Pick<
      User,
      | "disabled"
      | "flagged"
      | "flagReason"
      | "plan"
      | "stripeCustomerId"
      | "stripeSubscriptionId"
      | "stripeConnectAccountId"
      | "stripeConnectChargesEnabled"
      | "stripeConnectDetailsSubmitted"
    >
  >,
) {
  // Plan / Stripe customer fields must use the Neon-safe billing writer when live.
  const billingKeys = [
    "plan",
    "stripeCustomerId",
    "stripeSubscriptionId",
  ] as const;
  const hasBilling = billingKeys.some((k) => patch[k] !== undefined);
  if (hasBilling && isLiveBillingDb()) {
    const billingPatch: UserBillingPatch = {};
    for (const k of billingKeys) {
      if (patch[k] !== undefined) {
        (billingPatch as Record<string, unknown>)[k] = patch[k];
      }
    }
    const billed = await updateUserBilling(id, billingPatch);
    const rest = { ...patch };
    for (const k of billingKeys) delete rest[k];
    if (Object.keys(rest).length === 0) return billed;
    const [updated] = await getDb()
      .update(users)
      .set({ ...rest, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated ?? billed;
  }

  if (shouldUseDemoStore()) return demoStore.updateUser(id, patch);
  const [updated] = await getDb()
    .update(users)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return updated ?? null;
}

export async function listLinksForUser(userId: string) {
  return dbTry(
    () =>
      getDb().query.links.findMany({
        where: eq(links.userId, userId),
        orderBy: [desc(links.createdAt)],
      }),
    () =>
      demoStore
        .getLinksByUser(userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  );
}

export async function listAllLinks() {
  return dbTry(
    () =>
      getDb()
        .select({
          id: links.id,
          userId: links.userId,
          type: links.type,
          token: links.token,
          title: links.title,
          clientEmail: links.clientEmail,
          status: links.status,
          templateKey: links.templateKey,
          createdAt: links.createdAt,
          updatedAt: links.updatedAt,
          closedAt: links.closedAt,
          ownerEmail: users.email,
        })
        .from(links)
        .innerJoin(users, eq(users.id, links.userId))
        .orderBy(desc(links.createdAt)),
    () =>
      demoStore.getLinks().map((l) => ({
        ...l,
        ownerEmail: demoStore.getUserById(l.userId)?.email ?? "unknown",
      })),
  );
}

export async function getLinkById(id: string) {
  if (isSeededDemoLinkId(id)) return demoStore.getLinkById(id) ?? null;
  return dbTry(
    async () =>
      (await getDb().query.links.findFirst({ where: eq(links.id, id) })) ?? null,
    () => demoStore.getLinkById(id) ?? null,
  );
}

export async function getLinkByToken(token: string) {
  // /demo checklist + invoice must resolve without Neon, even when Clerk and
  // DATABASE_URL are configured (live mode). Schema may not be pushed yet.
  if (isSeededDemoToken(token)) {
    return demoStore.getLinkByToken(token) ?? null;
  }
  return dbTry(
    async () =>
      (await getDb().query.links.findFirst({
        where: eq(links.token, token),
      })) ?? null,
    () => demoStore.getLinkByToken(token) ?? null,
  );
}

export async function countActiveLinks(userId: string) {
  return dbTry(
    async () => {
      const [row] = await getDb()
        .select({ n: count() })
        .from(links)
        .where(and(eq(links.userId, userId), eq(links.status, "active")));
      return Number(row?.n ?? 0);
    },
    () =>
      demoStore
        .getLinksByUser(userId)
        .filter((l) => l.status === "active").length,
  );
}

export async function storageUsedByUser(userId: string) {
  return dbTry(
    async () => {
      const userLinks = await getDb()
        .select({ id: links.id })
        .from(links)
        .where(eq(links.userId, userId));
      if (!userLinks.length) return 0;
      const ids = userLinks.map((l) => l.id);
      const [row] = await getDb()
        .select({
          n: sql<number>`coalesce(sum(${files.sizeBytes}), 0)`,
        })
        .from(files)
        .where(inArray(files.linkId, ids));
      return Number(row?.n ?? 0);
    },
    () => demoStore.storageUsedByUser(userId),
  );
}

export async function createChecklistLink(input: {
  userId: string;
  title: string;
  clientEmail?: string | null;
  items: CreateItemInput[];
  templateKey?: string | null;
}) {
  if (shouldUseDemoStore()) return demoStore.createChecklistLink(input);

  const db = getDb();
  const linkId = newId("lnk");
  const token = newToken();
  const [link] = await db
    .insert(links)
    .values({
      id: linkId,
      userId: input.userId,
      type: "checklist",
      token,
      title: input.title,
      clientEmail: input.clientEmail ?? null,
      status: "active",
      templateKey: input.templateKey ?? null,
    })
    .returning();

  if (input.items.length) {
    await db.insert(checklistItems).values(
      input.items.map((item, i) => ({
        id: newId("cli"),
        linkId,
        label: item.label,
        itemType: item.itemType ?? "checkbox",
        required: item.required ?? true,
        position: i,
      })),
    );
  }
  return link;
}

export async function createInvoiceLink(input: {
  userId: string;
  title: string;
  clientEmail?: string | null;
  description?: string | null;
  dueAt?: Date | null;
  lineItems: { description: string; quantity: number; unitAmountCents: number }[];
}) {
  if (shouldUseDemoStore()) return demoStore.createInvoiceLink(input).link;

  const db = getDb();
  const linkId = newId("lnk");
  const token = newToken();
  const amountCents = input.lineItems.reduce(
    (sum, li) => sum + li.quantity * li.unitAmountCents,
    0,
  );
  const [link] = await db
    .insert(links)
    .values({
      id: linkId,
      userId: input.userId,
      type: "invoice",
      token,
      title: input.title,
      clientEmail: input.clientEmail ?? null,
      status: "active",
    })
    .returning();

  const invoiceId = newId("inv");
  await db.insert(invoices).values({
    id: invoiceId,
    linkId,
    amountCents,
    currency: "usd",
    description: input.description ?? null,
    dueAt: input.dueAt ?? null,
    status: "open",
  });

  if (input.lineItems.length) {
    await db.insert(invoiceLineItems).values(
      input.lineItems.map((li, i) => ({
        id: newId("ili"),
        invoiceId,
        description: li.description,
        quantity: li.quantity,
        unitAmountCents: li.unitAmountCents,
        position: i,
      })),
    );
  }

  return link;
}

export async function duplicateLink(linkId: string, userId: string) {
  const link = await getLinkById(linkId);
  if (!link || link.userId !== userId) return null;

  if (shouldUseDemoStore()) return demoStore.duplicateLink(linkId);

  if (link.type === "checklist") {
    const items = await getDb().query.checklistItems.findMany({
      where: eq(checklistItems.linkId, linkId),
    });
    return createChecklistLink({
      userId,
      title: `${link.title} (copy)`,
      clientEmail: link.clientEmail,
      templateKey: link.templateKey,
      items: items.map((i) => ({
        label: i.label,
        itemType: i.itemType,
        required: i.required,
      })),
    });
  }

  const inv = await getDb().query.invoices.findFirst({
    where: eq(invoices.linkId, linkId),
  });
  if (!inv) return null;
  const lines = await getDb().query.invoiceLineItems.findMany({
    where: eq(invoiceLineItems.invoiceId, inv.id),
  });
  return createInvoiceLink({
    userId,
    title: `${link.title} (copy)`,
    clientEmail: link.clientEmail,
    description: inv.description,
    dueAt: inv.dueAt,
    lineItems: lines.length
      ? lines.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitAmountCents: li.unitAmountCents,
        }))
      : [
          {
            description: inv.description || link.title,
            quantity: 1,
            unitAmountCents: inv.amountCents,
          },
        ],
  });
}

export async function updateLinkStatus(id: string, status: Link["status"]) {
  if (shouldUseDemoStore()) return demoStore.updateLinkStatus(id, status);
  const closed =
    status === "closed" || status === "disabled" || status === "archived";
  const [updated] = await getDb()
    .update(links)
    .set({
      status,
      updatedAt: new Date(),
      closedAt: closed ? new Date() : null,
    })
    .where(eq(links.id, id))
    .returning();
  return updated ?? null;
}

export async function getChecklistBundle(token: string) {
  const link = await getLinkByToken(token);
  if (!link || link.type !== "checklist") return null;

  if (demoForToken(token) || demoForLink(link.id)) {
    return {
      link,
      items: demoStore.getItemsForLink(link.id),
      files: demoStore.getFilesForLink(link.id),
      owner: demoStore.getUserById(link.userId) ?? null,
    };
  }

  return dbTry(
    async () => {
      const db = getDb();
      const items = await db.query.checklistItems.findMany({
        where: eq(checklistItems.linkId, link.id),
      });
      items.sort((a, b) => a.position - b.position);
      const fileRows = await db.query.files.findMany({
        where: eq(files.linkId, link.id),
      });
      const owner = await getUserById(link.userId);
      return { link, items, files: fileRows, owner };
    },
    () => ({
      link,
      items: demoStore.getItemsForLink(link.id),
      files: demoStore.getFilesForLink(link.id),
      owner: demoStore.getUserById(link.userId) ?? null,
    }),
  );
}

export async function updateChecklistItem(
  itemId: string,
  linkId: string,
  patch: { done?: boolean; answerText?: string | null },
) {
  if (demoForLink(linkId)) {
    const item = demoStore.updateItem(itemId, patch);
    await syncChecklistCompletion(linkId);
    return item;
  }

  const db = getDb();
  const updates: Record<string, unknown> = {};
  if (patch.done !== undefined) {
    updates.done = patch.done;
    updates.doneAt = patch.done ? new Date() : null;
  }
  if (patch.answerText !== undefined) {
    updates.answerText = patch.answerText;
    if (patch.answerText?.trim()) {
      updates.done = true;
      updates.doneAt = new Date();
    }
  }
  const [item] = await db
    .update(checklistItems)
    .set(updates)
    .where(
      and(eq(checklistItems.id, itemId), eq(checklistItems.linkId, linkId)),
    )
    .returning();
  await syncChecklistCompletion(linkId);
  return item ?? null;
}

export async function toggleChecklistItem(
  itemId: string,
  done: boolean,
  linkId: string,
) {
  return updateChecklistItem(itemId, linkId, { done });
}

async function syncChecklistCompletion(linkId: string) {
  if (demoForLink(linkId)) {
    const items = demoStore.getItemsForLink(linkId);
    // Optional empty items must not block "completed"
    if (checklistRequiredComplete(items)) {
      demoStore.updateLinkStatus(linkId, "completed");
    } else {
      const link = demoStore.getLinkById(linkId);
      if (link?.status === "completed") {
        demoStore.updateLinkStatus(linkId, "active");
      }
    }
    return;
  }
  const remaining = await getDb().query.checklistItems.findMany({
    where: eq(checklistItems.linkId, linkId),
  });
  if (checklistRequiredComplete(remaining)) {
    await updateLinkStatus(linkId, "completed");
  } else {
    const link = await getLinkById(linkId);
    if (link?.status === "completed") {
      await updateLinkStatus(linkId, "active");
    }
  }
}

export async function addFileRecord(input: {
  linkId: string;
  checklistItemId?: string | null;
  filename: string;
  contentType?: string | null;
  sizeBytes: number;
  storageKey: string;
}) {
  if (demoForLink(input.linkId)) {
    return demoStore.addFile({
      linkId: input.linkId,
      checklistItemId: input.checklistItemId ?? null,
      filename: input.filename,
      contentType: input.contentType ?? null,
      sizeBytes: input.sizeBytes,
      storageKey: input.storageKey,
    });
  }
  const [row] = await getDb()
    .insert(files)
    .values({
      id: newId("fil"),
      linkId: input.linkId,
      checklistItemId: input.checklistItemId ?? null,
      filename: input.filename,
      contentType: input.contentType ?? null,
      sizeBytes: input.sizeBytes,
      storageKey: input.storageKey,
    })
    .returning();
  if (input.checklistItemId) {
    await updateChecklistItem(input.checklistItemId, input.linkId, {
      done: true,
    });
  }
  return row;
}

export async function getInvoiceBundle(token: string) {
  const link = await getLinkByToken(token);
  if (!link || link.type !== "invoice") return null;

  if (demoForToken(token) || demoForLink(link.id)) {
    const invoice = demoStore.getInvoiceByLinkId(link.id) ?? null;
    return {
      link,
      invoice,
      lineItems: invoice ? demoStore.getLineItems(invoice.id) : [],
      owner: demoStore.getUserById(link.userId) ?? null,
    };
  }

  return dbTry(
    async () => {
      const invoice =
        (await getDb().query.invoices.findFirst({
          where: eq(invoices.linkId, link.id),
        })) ?? null;
      const lineItems = invoice
        ? await getDb().query.invoiceLineItems.findMany({
            where: eq(invoiceLineItems.invoiceId, invoice.id),
          })
        : [];
      lineItems.sort((a, b) => a.position - b.position);
      const owner = await getUserById(link.userId);
      return { link, invoice, lineItems, owner };
    },
    () => {
      const invoice = demoStore.getInvoiceByLinkId(link.id) ?? null;
      return {
        link,
        invoice,
        lineItems: invoice ? demoStore.getLineItems(invoice.id) : [],
        owner: demoStore.getUserById(link.userId) ?? null,
      };
    },
  );
}

export async function listAllInvoices() {
  return dbTry(
    () =>
      getDb()
        .select({
          id: invoices.id,
          linkId: invoices.linkId,
          amountCents: invoices.amountCents,
          currency: invoices.currency,
          description: invoices.description,
          dueAt: invoices.dueAt,
          status: invoices.status,
          paidAt: invoices.paidAt,
          paidManually: invoices.paidManually,
          createdAt: invoices.createdAt,
          updatedAt: invoices.updatedAt,
          title: links.title,
          token: links.token,
          ownerEmail: users.email,
          linkStatus: links.status,
        })
        .from(invoices)
        .innerJoin(links, eq(links.id, invoices.linkId))
        .innerJoin(users, eq(users.id, links.userId))
        .orderBy(desc(invoices.createdAt)),
    () =>
      demoStore.getInvoices().map((inv) => {
        const link = demoStore.getLinkById(inv.linkId);
        return {
          ...inv,
          title: link?.title ?? "",
          token: link?.token ?? "",
          ownerEmail: link
            ? (demoStore.getUserById(link.userId)?.email ?? "unknown")
            : "unknown",
          linkStatus: link?.status ?? "closed",
        };
      }),
  );
}

export async function markInvoicePaid(
  linkId: string,
  paymentIntentId?: string | null,
  manual = false,
) {
  if (demoForLink(linkId)) {
    return demoStore.markInvoicePaid(linkId, {
      paymentIntentId,
      manual,
    });
  }

  const db = getDb();
  const [inv] = await db
    .update(invoices)
    .set({
      status: "paid",
      paidAt: new Date(),
      paidManually: manual,
      stripePaymentIntentId: paymentIntentId ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(invoices.linkId, linkId))
    .returning();
  await updateLinkStatus(linkId, "completed");
  return inv ?? null;
}

export async function setCheckoutSession(linkId: string, sessionId: string) {
  if (demoForLink(linkId)) return demoStore.setCheckoutSession(linkId, sessionId);
  const [inv] = await getDb()
    .update(invoices)
    .set({
      stripeCheckoutSessionId: sessionId,
      updatedAt: new Date(),
    })
    .where(eq(invoices.linkId, linkId))
    .returning();
  return inv ?? null;
}

export async function getInvoiceByCheckoutSession(sessionId: string) {
  return dbTry(
    async () =>
      (await getDb().query.invoices.findFirst({
        where: eq(invoices.stripeCheckoutSessionId, sessionId),
      })) ?? null,
    () =>
      demoStore
        .getInvoices()
        .find((i) => i.stripeCheckoutSessionId === sessionId) ?? null,
  );
}

export async function adminMetrics() {
  return dbTry(
    async () => {
      const db = getDb();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [userCount] = await db.select({ n: count() }).from(users);
      const [activeChecklists] = await db
        .select({ n: count() })
        .from(links)
        .where(and(eq(links.type, "checklist"), eq(links.status, "active")));
      const [activeInvoices] = await db
        .select({ n: count() })
        .from(links)
        .where(and(eq(links.type, "invoice"), eq(links.status, "active")));
      const [paid] = await db
        .select({
          n: count(),
          gmv: sql<number>`coalesce(sum(${invoices.amountCents}), 0)`,
        })
        .from(invoices)
        .where(eq(invoices.status, "paid"));
      const [recent] = await db
        .select({ n: count() })
        .from(users)
        .where(gte(users.createdAt, weekAgo));

      return {
        users: Number(userCount?.n ?? 0),
        activeChecklists: Number(activeChecklists?.n ?? 0),
        activeInvoices: Number(activeInvoices?.n ?? 0),
        paidInvoices: Number(paid?.n ?? 0),
        gmvCents: Number(paid?.gmv ?? 0),
        recentSignups: Number(recent?.n ?? 0),
      };
    },
    () => demoStore.metrics(),
  );
}

export async function getUserDetail(id: string) {
  const user = await getUserById(id);
  if (!user) return null;
  const userLinks = await listLinksForUser(id);
  return { user, links: userLinks };
}

export async function getLinkProgress(linkId: string) {
  return dbTry(
    async () => {
      const items = await getDb().query.checklistItems.findMany({
        where: eq(checklistItems.linkId, linkId),
      });
      return checklistProgress(items);
    },
    () => checklistProgress(demoStore.getItemsForLink(linkId)),
  );
}

/** Missing optional tables must not poison the whole DB into demo mode. */
function isMissingRelation(err: unknown, table: string) {
  const e = err as { code?: string; message?: string };
  if (e?.code === "42P01") {
    const msg = e?.message || "";
    return !msg || new RegExp(table, "i").test(msg);
  }
  const msg = e?.message || "";
  return new RegExp(`relation ["']?${table}["']? does not exist`, "i").test(
    msg,
  );
}

function isMissingFeedbackRelation(err: unknown) {
  return isMissingRelation(err, "feedback");
}

function isMissingChangelogRelation(err: unknown) {
  return isMissingRelation(err, "changelog_entries");
}

async function feedbackDbTry<T>(
  run: () => Promise<T>,
  fallback: () => T | Promise<T>,
): Promise<T> {
  if (shouldUseDemoStore()) return fallback();
  try {
    return await run();
  } catch (err) {
    if (isMissingFeedbackRelation(err)) {
      console.warn(
        "[totebird] feedback table missing; soft-failing. Apply neon-feedback-table.sql in Neon SQL Editor.",
      );
      return fallback();
    }
    noteDbFailure(err);
    return fallback();
  }
}

async function changelogDbTry<T>(
  run: () => Promise<T>,
  fallback: () => T | Promise<T>,
): Promise<T> {
  if (shouldUseDemoStore()) return fallback();
  try {
    return await run();
  } catch (err) {
    if (isMissingChangelogRelation(err)) {
      console.warn(
        "[totebird] changelog_entries table missing; soft-failing. Apply neon-changelog-table.sql in Neon SQL Editor.",
      );
      return fallback();
    }
    noteDbFailure(err);
    return fallback();
  }
}

export type FeedbackListFilters = {
  type?: Feedback["type"];
  status?: Feedback["status"];
};

export type FeedbackListRow = Feedback & {
  ownerEmail: string | null;
};

export class FeedbackTableMissingError extends Error {
  constructor() {
    super("FEEDBACK_TABLE_MISSING");
    this.name = "FeedbackTableMissingError";
  }
}

export async function createFeedback(input: {
  userId?: string | null;
  type: Feedback["type"];
  body: string;
  pageUrl?: string | null;
}): Promise<Feedback> {
  const body = input.body.trim();
  const demoCreate = () =>
    demoStore.createFeedback({
      userId: input.userId,
      type: input.type,
      body,
      pageUrl: input.pageUrl,
    });

  if (shouldUseDemoStore()) return demoCreate();

  try {
    const [row] = await getDb()
      .insert(feedback)
      .values({
        id: newId("fbk"),
        userId: input.userId ?? null,
        type: input.type,
        body,
        pageUrl: input.pageUrl?.trim() || null,
      })
      .returning();
    return row;
  } catch (err) {
    if (isMissingFeedbackRelation(err)) {
      console.warn(
        "[totebird] feedback table missing; refuse create. Apply neon-feedback-table.sql in Neon SQL Editor.",
      );
      throw new FeedbackTableMissingError();
    }
    noteDbFailure(err);
    return demoCreate();
  }
}

export async function listFeedback(
  filters: FeedbackListFilters = {},
): Promise<FeedbackListRow[]> {
  return feedbackDbTry(
    async () => {
      const conditions = [];
      if (filters.type) conditions.push(eq(feedback.type, filters.type));
      if (filters.status) conditions.push(eq(feedback.status, filters.status));
      const where =
        conditions.length === 0
          ? undefined
          : conditions.length === 1
            ? conditions[0]
            : and(...conditions);

      return getDb()
        .select({
          id: feedback.id,
          userId: feedback.userId,
          type: feedback.type,
          body: feedback.body,
          pageUrl: feedback.pageUrl,
          status: feedback.status,
          priority: feedback.priority,
          createdAt: feedback.createdAt,
          updatedAt: feedback.updatedAt,
          ownerEmail: users.email,
        })
        .from(feedback)
        .leftJoin(users, eq(users.id, feedback.userId))
        .where(where)
        .orderBy(desc(feedback.createdAt));
    },
    () => {
      let rows = demoStore.getFeedback();
      if (filters.type) rows = rows.filter((r) => r.type === filters.type);
      if (filters.status)
        rows = rows.filter((r) => r.status === filters.status);
      return rows
        .slice()
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((r) => ({
          ...r,
          ownerEmail: r.userId
            ? (demoStore.getUserById(r.userId)?.email ?? null)
            : null,
        }));
    },
  );
}

export async function updateFeedback(
  id: string,
  patch: Partial<Pick<Feedback, "status" | "priority">>,
): Promise<Feedback | null> {
  return feedbackDbTry(
    async () => {
      const [row] = await getDb()
        .update(feedback)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(feedback.id, id))
        .returning();
      return row ?? null;
    },
    () => demoStore.updateFeedback(id, patch),
  );
}

export async function getFeedbackById(id: string): Promise<Feedback | null> {
  return feedbackDbTry(
    async () =>
      (await getDb().query.feedback.findFirst({
        where: eq(feedback.id, id),
      })) ?? null,
    () => demoStore.getFeedbackById(id),
  );
}

export async function deleteFeedback(id: string): Promise<boolean> {
  return feedbackDbTry(
    async () => {
      const deleted = await getDb()
        .delete(feedback)
        .where(eq(feedback.id, id))
        .returning({ id: feedback.id });
      return deleted.length > 0;
    },
    () => demoStore.deleteFeedback(id),
  );
}

export class ChangelogTableMissingError extends Error {
  constructor() {
    super("CHANGELOG_TABLE_MISSING");
    this.name = "ChangelogTableMissingError";
  }
}

export function defaultChangelogKindFromFeedback(
  type: Feedback["type"],
): ChangelogEntry["kind"] {
  return type === "bug" ? "fix" : "feature";
}

/** Short title from feedback body for publish form defaults. */
export function defaultChangelogTitleFromBody(body: string) {
  const firstLine = body.trim().split(/\r?\n/)[0]?.trim() || "Update";
  return firstLine.length > 100 ? `${firstLine.slice(0, 97)}…` : firstLine;
}

export async function listChangelogEntries(): Promise<ChangelogEntry[]> {
  return changelogDbTry(
    () =>
      getDb().query.changelogEntries.findMany({
        orderBy: [desc(changelogEntries.publishedAt)],
      }),
    () =>
      demoStore
        .getChangelogEntries()
        .slice()
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()),
  );
}

export async function createChangelogEntry(input: {
  title: string;
  body?: string | null;
  kind: ChangelogEntry["kind"];
  sourceFeedbackId?: string | null;
}): Promise<ChangelogEntry> {
  const title = input.title.trim();
  const body = input.body?.trim() || null;
  const demoCreate = () =>
    demoStore.createChangelogEntry({
      title,
      body,
      kind: input.kind,
      sourceFeedbackId: input.sourceFeedbackId,
    });

  if (shouldUseDemoStore()) return demoCreate();

  try {
    const [row] = await getDb()
      .insert(changelogEntries)
      .values({
        id: newId("chg"),
        title,
        body,
        kind: input.kind,
        sourceFeedbackId: input.sourceFeedbackId ?? null,
      })
      .returning();
    return row;
  } catch (err) {
    if (isMissingChangelogRelation(err)) {
      console.warn(
        "[totebird] changelog_entries missing; refuse create. Apply neon-changelog-table.sql.",
      );
      throw new ChangelogTableMissingError();
    }
    noteDbFailure(err);
    return demoCreate();
  }
}

/**
 * Publish a done feedback item to the public changelog, then delete the triage row.
 */
export async function publishFeedbackToChangelog(
  feedbackId: string,
  input: {
    title: string;
    body?: string | null;
    kind: ChangelogEntry["kind"];
  },
): Promise<{ entry: ChangelogEntry; deleted: boolean }> {
  const row = await getFeedbackById(feedbackId);
  if (!row) {
    throw new Error("FEEDBACK_NOT_FOUND");
  }
  if (row.status !== "done") {
    throw new Error("FEEDBACK_NOT_DONE");
  }

  const entry = await createChangelogEntry({
    title: input.title,
    body: input.body ?? row.body,
    kind: input.kind,
    sourceFeedbackId: row.id,
  });

  const deleted = await deleteFeedback(feedbackId);
  return { entry, deleted };
}

export type { ChangelogEntry, Feedback, Invoice, InvoiceLineItem, Link, User };
