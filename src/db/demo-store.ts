import { newId, newToken } from "@/lib/ids";
import type {
  ChecklistItem,
  Event,
  FileRow,
  Invoice,
  Link,
  User,
} from "./schema";

/** In-memory store used when DATABASE_URL is missing (local/demo). */
type Store = {
  users: User[];
  links: Link[];
  checklistItems: ChecklistItem[];
  files: FileRow[];
  invoices: Invoice[];
  events: Event[];
};

const g = globalThis as unknown as { __totebirdDemo?: Store };

function store(): Store {
  if (!g.__totebirdDemo) {
    const now = new Date();
    const demoUser: User = {
      id: "usr_demo",
      clerkId: "user_demo",
      email: "demo@totebird.local",
      name: "Demo Freelancer",
      plan: "free",
      disabled: false,
      flagged: false,
      flagReason: null,
      createdAt: now,
      updatedAt: now,
    };

    const checklistLink: Link = {
      id: "lnk_demo_checklist",
      userId: demoUser.id,
      type: "checklist",
      token: "demo-checklist",
      title: "Brand assets checklist",
      clientEmail: "client@example.com",
      status: "active",
      createdAt: now,
      updatedAt: now,
      closedAt: null,
    };

    const invoiceLink: Link = {
      id: "lnk_demo_invoice",
      userId: demoUser.id,
      type: "invoice",
      token: "demo-invoice",
      title: "Website redesign deposit",
      clientEmail: "client@example.com",
      status: "active",
      createdAt: now,
      updatedAt: now,
      closedAt: null,
    };

    g.__totebirdDemo = {
      users: [demoUser],
      links: [checklistLink, invoiceLink],
      checklistItems: [
        {
          id: "cli_1",
          linkId: checklistLink.id,
          label: "Logo (SVG or PNG)",
          done: false,
          position: 0,
          doneAt: null,
          createdAt: now,
        },
        {
          id: "cli_2",
          linkId: checklistLink.id,
          label: "Brand colors",
          done: true,
          position: 1,
          doneAt: now,
          createdAt: now,
        },
        {
          id: "cli_3",
          linkId: checklistLink.id,
          label: "Fonts in use",
          done: false,
          position: 2,
          doneAt: null,
          createdAt: now,
        },
      ],
      files: [],
      invoices: [
        {
          id: "inv_demo",
          linkId: invoiceLink.id,
          amountCents: 150000,
          currency: "usd",
          description: "50% deposit — website redesign",
          dueAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          status: "open",
          stripeCheckoutSessionId: null,
          stripePaymentIntentId: null,
          paidAt: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
      events: [],
    };
  }
  return g.__totebirdDemo;
}

export const demoStore = {
  getUsers: () => store().users,
  getUserById: (id: string) => store().users.find((u) => u.id === id),
  getUserByClerkId: (clerkId: string) =>
    store().users.find((u) => u.clerkId === clerkId),
  getUserByEmail: (email: string) =>
    store().users.find((u) => u.email.toLowerCase() === email.toLowerCase()),

  upsertUser(input: {
    clerkId: string;
    email: string;
    name?: string | null;
  }): User {
    const existing = demoStore.getUserByClerkId(input.clerkId);
    if (existing) {
      existing.email = input.email;
      existing.name = input.name ?? existing.name;
      existing.updatedAt = new Date();
      return existing;
    }
    const user: User = {
      id: newId("usr"),
      clerkId: input.clerkId,
      email: input.email,
      name: input.name ?? null,
      plan: "free",
      disabled: false,
      flagged: false,
      flagReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store().users.push(user);
    return user;
  },

  updateUser(
    id: string,
    patch: Partial<Pick<User, "disabled" | "flagged" | "flagReason" | "plan">>,
  ) {
    const u = demoStore.getUserById(id);
    if (!u) return null;
    Object.assign(u, patch, { updatedAt: new Date() });
    return u;
  },

  getLinks: () => store().links,
  getLinksByUser: (userId: string) =>
    store().links.filter((l) => l.userId === userId),
  getLinkById: (id: string) => store().links.find((l) => l.id === id),
  getLinkByToken: (token: string) =>
    store().links.find((l) => l.token === token),

  createChecklistLink(input: {
    userId: string;
    title: string;
    clientEmail?: string | null;
    items: string[];
  }) {
    const now = new Date();
    const link: Link = {
      id: newId("lnk"),
      userId: input.userId,
      type: "checklist",
      token: newToken(),
      title: input.title,
      clientEmail: input.clientEmail ?? null,
      status: "active",
      createdAt: now,
      updatedAt: now,
      closedAt: null,
    };
    store().links.push(link);
    input.items.forEach((label, i) => {
      store().checklistItems.push({
        id: newId("cli"),
        linkId: link.id,
        label,
        done: false,
        position: i,
        doneAt: null,
        createdAt: now,
      });
    });
    return link;
  },

  createInvoiceLink(input: {
    userId: string;
    title: string;
    clientEmail?: string | null;
    amountCents: number;
    currency?: string;
    description?: string | null;
    dueAt?: Date | null;
  }) {
    const now = new Date();
    const link: Link = {
      id: newId("lnk"),
      userId: input.userId,
      type: "invoice",
      token: newToken(),
      title: input.title,
      clientEmail: input.clientEmail ?? null,
      status: "active",
      createdAt: now,
      updatedAt: now,
      closedAt: null,
    };
    store().links.push(link);
    const invoice: Invoice = {
      id: newId("inv"),
      linkId: link.id,
      amountCents: input.amountCents,
      currency: input.currency ?? "usd",
      description: input.description ?? null,
      dueAt: input.dueAt ?? null,
      status: "open",
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      paidAt: null,
      createdAt: now,
      updatedAt: now,
    };
    store().invoices.push(invoice);
    return { link, invoice };
  },

  updateLinkStatus(id: string, status: Link["status"]) {
    const link = demoStore.getLinkById(id);
    if (!link) return null;
    link.status = status;
    link.updatedAt = new Date();
    if (status === "closed" || status === "disabled") {
      link.closedAt = new Date();
    }
    return link;
  },

  getItemsForLink: (linkId: string) =>
    store()
      .checklistItems.filter((i) => i.linkId === linkId)
      .sort((a, b) => a.position - b.position),

  toggleItem(itemId: string, done: boolean) {
    const item = store().checklistItems.find((i) => i.id === itemId);
    if (!item) return null;
    item.done = done;
    item.doneAt = done ? new Date() : null;
    return item;
  },

  addFile(input: Omit<FileRow, "id" | "uploadedAt"> & { id?: string }) {
    const row: FileRow = {
      id: input.id ?? newId("fil"),
      linkId: input.linkId,
      checklistItemId: input.checklistItemId,
      filename: input.filename,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      storageKey: input.storageKey,
      uploadedAt: new Date(),
    };
    store().files.push(row);
    return row;
  },

  getFilesForLink: (linkId: string) =>
    store().files.filter((f) => f.linkId === linkId),

  getInvoices: () => store().invoices,
  getInvoiceByLinkId: (linkId: string) =>
    store().invoices.find((i) => i.linkId === linkId),

  markInvoicePaid(linkId: string, paymentIntentId?: string | null) {
    const inv = demoStore.getInvoiceByLinkId(linkId);
    if (!inv) return null;
    inv.status = "paid";
    inv.paidAt = new Date();
    inv.stripePaymentIntentId = paymentIntentId ?? inv.stripePaymentIntentId;
    inv.updatedAt = new Date();
    const link = demoStore.getLinkById(linkId);
    if (link) {
      link.status = "completed";
      link.updatedAt = new Date();
    }
    return inv;
  },

  setCheckoutSession(linkId: string, sessionId: string) {
    const inv = demoStore.getInvoiceByLinkId(linkId);
    if (!inv) return null;
    inv.stripeCheckoutSessionId = sessionId;
    inv.updatedAt = new Date();
    return inv;
  },

  addEvent(input: {
    type: string;
    linkId?: string | null;
    userId?: string | null;
    meta?: string | null;
  }) {
    const ev: Event = {
      id: newId("evt"),
      linkId: input.linkId ?? null,
      userId: input.userId ?? null,
      type: input.type,
      meta: input.meta ?? null,
      createdAt: new Date(),
    };
    store().events.push(ev);
    return ev;
  },

  metrics() {
    const s = store();
    const activeChecklists = s.links.filter(
      (l) => l.type === "checklist" && l.status === "active",
    ).length;
    const activeInvoices = s.links.filter(
      (l) => l.type === "invoice" && l.status === "active",
    ).length;
    const paid = s.invoices.filter((i) => i.status === "paid");
    const gmvCents = paid.reduce((sum, i) => sum + i.amountCents, 0);
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentSignups = s.users.filter(
      (u) => u.createdAt.getTime() >= weekAgo,
    ).length;
    return {
      users: s.users.length,
      activeChecklists,
      activeInvoices,
      paidInvoices: paid.length,
      gmvCents,
      recentSignups,
    };
  },
};
