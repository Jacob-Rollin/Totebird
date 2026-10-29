import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { demoStore } from "@/db/demo-store";
import {
  checklistItems,
  files,
  invoices,
  links,
  users,
  type Invoice,
  type Link,
  type User,
} from "@/db/schema";
import { hasDatabase, isDemoMode } from "@/lib/env";
import { newId, newToken } from "@/lib/ids";

function shouldUseDemoStore() {
  return isDemoMode() || !hasDatabase();
}

export async function ensureUser(input: {
  clerkId: string;
  email: string;
  name?: string | null;
}): Promise<User> {
  if (shouldUseDemoStore()) return demoStore.upsertUser(input);

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
}

export async function getUserById(id: string) {
  if (shouldUseDemoStore()) return demoStore.getUserById(id) ?? null;
  return (
    (await getDb().query.users.findFirst({ where: eq(users.id, id) })) ?? null
  );
}

export async function getUserByClerkId(clerkId: string) {
  if (shouldUseDemoStore()) return demoStore.getUserByClerkId(clerkId) ?? null;
  return (
    (await getDb().query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    })) ?? null
  );
}

export async function listUsers() {
  if (shouldUseDemoStore()) {
    return demoStore.getUsers().map((u) => ({
      ...u,
      linkCount: demoStore.getLinksByUser(u.id).length,
    }));
  }
  const db = getDb();
  const rows = await db
    .select({
      id: users.id,
      clerkId: users.clerkId,
      email: users.email,
      name: users.name,
      plan: users.plan,
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
  return rows;
}

export async function updateUserModeration(
  id: string,
  patch: Partial<Pick<User, "disabled" | "flagged" | "flagReason">>,
) {
  if (shouldUseDemoStore()) return demoStore.updateUser(id, patch);
  const [updated] = await getDb()
    .update(users)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return updated ?? null;
}

export async function listLinksForUser(userId: string) {
  if (shouldUseDemoStore()) {
    return demoStore
      .getLinksByUser(userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return getDb().query.links.findMany({
    where: eq(links.userId, userId),
    orderBy: [desc(links.createdAt)],
  });
}

export async function listAllLinks() {
  if (shouldUseDemoStore()) {
    return demoStore.getLinks().map((l) => ({
      ...l,
      ownerEmail: demoStore.getUserById(l.userId)?.email ?? "unknown",
    }));
  }
  const rows = await getDb()
    .select({
      id: links.id,
      userId: links.userId,
      type: links.type,
      token: links.token,
      title: links.title,
      clientEmail: links.clientEmail,
      status: links.status,
      createdAt: links.createdAt,
      updatedAt: links.updatedAt,
      closedAt: links.closedAt,
      ownerEmail: users.email,
    })
    .from(links)
    .innerJoin(users, eq(users.id, links.userId))
    .orderBy(desc(links.createdAt));
  return rows;
}

export async function getLinkById(id: string) {
  if (shouldUseDemoStore()) return demoStore.getLinkById(id) ?? null;
  return (
    (await getDb().query.links.findFirst({ where: eq(links.id, id) })) ?? null
  );
}

export async function getLinkByToken(token: string) {
  if (shouldUseDemoStore()) return demoStore.getLinkByToken(token) ?? null;
  return (
    (await getDb().query.links.findFirst({ where: eq(links.token, token) })) ??
    null
  );
}

export async function countActiveLinks(userId: string) {
  if (shouldUseDemoStore()) {
    return demoStore
      .getLinksByUser(userId)
      .filter((l) => l.status === "active").length;
  }
  const [row] = await getDb()
    .select({ n: count() })
    .from(links)
    .where(and(eq(links.userId, userId), eq(links.status, "active")));
  return Number(row?.n ?? 0);
}

export async function createChecklistLink(input: {
  userId: string;
  title: string;
  clientEmail?: string | null;
  items: string[];
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
    })
    .returning();

  if (input.items.length) {
    await db.insert(checklistItems).values(
      input.items.map((label, i) => ({
        id: newId("cli"),
        linkId,
        label,
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
  amountCents: number;
  currency?: string;
  description?: string | null;
  dueAt?: Date | null;
}) {
  if (shouldUseDemoStore()) return demoStore.createInvoiceLink(input).link;

  const db = getDb();
  const linkId = newId("lnk");
  const token = newToken();
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

  await db.insert(invoices).values({
    id: newId("inv"),
    linkId,
    amountCents: input.amountCents,
    currency: input.currency ?? "usd",
    description: input.description ?? null,
    dueAt: input.dueAt ?? null,
    status: "open",
  });

  return link;
}

export async function updateLinkStatus(id: string, status: Link["status"]) {
  if (shouldUseDemoStore()) return demoStore.updateLinkStatus(id, status);
  const [updated] = await getDb()
    .update(links)
    .set({
      status,
      updatedAt: new Date(),
      closedAt:
        status === "closed" || status === "disabled" ? new Date() : null,
    })
    .where(eq(links.id, id))
    .returning();
  return updated ?? null;
}

export async function getChecklistBundle(token: string) {
  const link = await getLinkByToken(token);
  if (!link || link.type !== "checklist") return null;

  if (shouldUseDemoStore()) {
    return {
      link,
      items: demoStore.getItemsForLink(link.id),
      files: demoStore.getFilesForLink(link.id),
      owner: demoStore.getUserById(link.userId) ?? null,
    };
  }

  const db = getDb();
  const items = await db.query.checklistItems.findMany({
    where: eq(checklistItems.linkId, link.id),
    orderBy: [checklistItems.position],
  });
  const fileRows = await db.query.files.findMany({
    where: eq(files.linkId, link.id),
  });
  const owner = await getUserById(link.userId);
  return { link, items, files: fileRows, owner };
}

export async function toggleChecklistItem(
  itemId: string,
  done: boolean,
  linkId: string,
) {
  if (shouldUseDemoStore()) {
    const item = demoStore.toggleItem(itemId, done);
    const items = demoStore.getItemsForLink(linkId);
    if (items.length && items.every((i) => i.done)) {
      demoStore.updateLinkStatus(linkId, "completed");
    } else {
      const link = demoStore.getLinkById(linkId);
      if (link?.status === "completed") {
        demoStore.updateLinkStatus(linkId, "active");
      }
    }
    return item;
  }

  const db = getDb();
  const [item] = await db
    .update(checklistItems)
    .set({ done, doneAt: done ? new Date() : null })
    .where(
      and(eq(checklistItems.id, itemId), eq(checklistItems.linkId, linkId)),
    )
    .returning();

  const remaining = await db.query.checklistItems.findMany({
    where: eq(checklistItems.linkId, linkId),
  });
  if (remaining.length && remaining.every((i) => i.done)) {
    await updateLinkStatus(linkId, "completed");
  } else {
    const link = await getLinkById(linkId);
    if (link?.status === "completed") {
      await updateLinkStatus(linkId, "active");
    }
  }
  return item ?? null;
}

export async function addFileRecord(input: {
  linkId: string;
  checklistItemId?: string | null;
  filename: string;
  contentType?: string | null;
  sizeBytes: number;
  storageKey: string;
}) {
  if (shouldUseDemoStore()) {
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
  return row;
}

export async function getInvoiceBundle(token: string) {
  const link = await getLinkByToken(token);
  if (!link || link.type !== "invoice") return null;

  if (shouldUseDemoStore()) {
    return {
      link,
      invoice: demoStore.getInvoiceByLinkId(link.id) ?? null,
      owner: demoStore.getUserById(link.userId) ?? null,
    };
  }

  const invoice =
    (await getDb().query.invoices.findFirst({
      where: eq(invoices.linkId, link.id),
    })) ?? null;
  const owner = await getUserById(link.userId);
  return { link, invoice, owner };
}

export async function listAllInvoices() {
  if (shouldUseDemoStore()) {
    return demoStore.getInvoices().map((inv) => {
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
    });
  }

  return getDb()
    .select({
      id: invoices.id,
      linkId: invoices.linkId,
      amountCents: invoices.amountCents,
      currency: invoices.currency,
      description: invoices.description,
      dueAt: invoices.dueAt,
      status: invoices.status,
      paidAt: invoices.paidAt,
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
    .orderBy(desc(invoices.createdAt));
}

export async function markInvoicePaid(
  linkId: string,
  paymentIntentId?: string | null,
) {
  if (shouldUseDemoStore()) return demoStore.markInvoicePaid(linkId, paymentIntentId);

  const db = getDb();
  const [inv] = await db
    .update(invoices)
    .set({
      status: "paid",
      paidAt: new Date(),
      stripePaymentIntentId: paymentIntentId ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(invoices.linkId, linkId))
    .returning();
  await updateLinkStatus(linkId, "completed");
  return inv ?? null;
}

export async function setCheckoutSession(linkId: string, sessionId: string) {
  if (shouldUseDemoStore()) return demoStore.setCheckoutSession(linkId, sessionId);
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
  if (shouldUseDemoStore()) {
    return (
      demoStore
        .getInvoices()
        .find((i) => i.stripeCheckoutSessionId === sessionId) ?? null
    );
  }
  return (
    (await getDb().query.invoices.findFirst({
      where: eq(invoices.stripeCheckoutSessionId, sessionId),
    })) ?? null
  );
}

export async function adminMetrics() {
  if (shouldUseDemoStore()) return demoStore.metrics();

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
}

export async function getUserDetail(id: string) {
  const user = await getUserById(id);
  if (!user) return null;
  const userLinks = await listLinksForUser(id);
  return { user, links: userLinks };
}

export type { Invoice, Link, User };
