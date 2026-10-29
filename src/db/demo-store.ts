import { newId, newToken } from "@/lib/ids";
import type {
  ChecklistItem,
  Event,
  FileRow,
  Invoice,
  InvoiceLineItem,
  Link,
  User,
} from "./schema";

type Store = {
  users: User[];
  links: Link[];
  checklistItems: ChecklistItem[];
  files: FileRow[];
  invoices: Invoice[];
  invoiceLineItems: InvoiceLineItem[];
  events: Event[];
};

const g = globalThis as unknown as { __totebirdDemoV2?: Store };

function store(): Store {
  if (!g.__totebirdDemoV2) {
    const now = new Date();
    const demoUser: User = {
      id: "usr_demo",
      clerkId: "user_demo",
      email: process.env.ADMIN_EMAIL?.split(",")[0]?.trim() || "demo@totebird.local",
      name: "Demo Freelancer",
      plan: "free",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeConnectAccountId: null,
      stripeConnectChargesEnabled: false,
      stripeConnectDetailsSubmitted: false,
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
      title: "Web design kickoff",
      clientEmail: "client@example.com",
      status: "active",
      templateKey: "web-design-kickoff",
      createdAt: now,
      updatedAt: now,
      closedAt: null,
    };

    const invoiceLink: Link = {
      id: "lnk_demo_invoice",
      userId: demoUser.id,
      type: "invoice",
      token: "demo-invoice",
      title: "Website redesign — deposit",
      clientEmail: "client@example.com",
      status: "active",
      templateKey: null,
      createdAt: now,
      updatedAt: now,
      closedAt: null,
    };

    const invId = "inv_demo";

    g.__totebirdDemoV2 = {
      users: [
        demoUser,
        {
          id: "usr_sample",
          clerkId: "user_sample",
          email: "alex@studio.example",
          name: "Alex Studio",
          plan: "solo",
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          stripeConnectAccountId: null,
          stripeConnectChargesEnabled: false,
          stripeConnectDetailsSubmitted: false,
          disabled: false,
          flagged: false,
          flagReason: null,
          createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: now,
        },
      ],
      links: [checklistLink, invoiceLink],
      checklistItems: [
        {
          id: "cli_1",
          linkId: checklistLink.id,
          label: "Logo (SVG or PNG)",
          itemType: "file",
          required: true,
          done: false,
          answerText: null,
          position: 0,
          doneAt: null,
          createdAt: now,
        },
        {
          id: "cli_2",
          linkId: checklistLink.id,
          label: "Brand colors (hex)",
          itemType: "text",
          required: true,
          done: true,
          answerText: "#394554 / #EE901F",
          position: 1,
          doneAt: now,
          createdAt: now,
        },
        {
          id: "cli_3",
          linkId: checklistLink.id,
          label: "Fonts in use",
          itemType: "text",
          required: false,
          done: false,
          answerText: null,
          position: 2,
          doneAt: null,
          createdAt: now,
        },
        {
          id: "cli_4",
          linkId: checklistLink.id,
          label: "Sitemap / page list approved",
          itemType: "checkbox",
          required: true,
          done: true,
          answerText: null,
          position: 3,
          doneAt: now,
          createdAt: now,
        },
        {
          id: "cli_5",
          linkId: checklistLink.id,
          label: "Domain registrar login shared",
          itemType: "checkbox",
          required: false,
          done: false,
          answerText: null,
          position: 4,
          doneAt: null,
          createdAt: now,
        },
        {
          id: "cli_6",
          linkId: checklistLink.id,
          label: "Reference sites (URLs)",
          itemType: "text",
          required: false,
          done: false,
          answerText: null,
          position: 5,
          doneAt: null,
          createdAt: now,
        },
      ],
      files: [],
      invoices: [
        {
          id: invId,
          linkId: invoiceLink.id,
          amountCents: 275000,
          currency: "usd",
          description: "50% deposit for website redesign",
          dueAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          status: "open",
          stripeCheckoutSessionId: null,
          stripePaymentIntentId: null,
          paidAt: null,
          paidManually: false,
          createdAt: now,
          updatedAt: now,
        },
      ],
      invoiceLineItems: [
        {
          id: "ili_1",
          invoiceId: invId,
          description: "Discovery & sitemap",
          quantity: 1,
          unitAmountCents: 50000,
          position: 0,
        },
        {
          id: "ili_2",
          invoiceId: invId,
          description: "UI design (5 pages)",
          quantity: 1,
          unitAmountCents: 150000,
          position: 1,
        },
        {
          id: "ili_3",
          invoiceId: invId,
          description: "Deposit (50%)",
          quantity: 1,
          unitAmountCents: 75000,
          position: 2,
        },
      ],
      events: [],
    };
  }
  return g.__totebirdDemoV2;
}

export type CreateItemInput = {
  label: string;
  itemType?: ChecklistItem["itemType"];
  required?: boolean;
};

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
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeConnectAccountId: null,
      stripeConnectChargesEnabled: false,
      stripeConnectDetailsSubmitted: false,
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
    items: CreateItemInput[];
    templateKey?: string | null;
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
      templateKey: input.templateKey ?? null,
      createdAt: now,
      updatedAt: now,
      closedAt: null,
    };
    store().links.push(link);
    input.items.forEach((item, i) => {
      store().checklistItems.push({
        id: newId("cli"),
        linkId: link.id,
        label: item.label,
        itemType: item.itemType ?? "checkbox",
        required: item.required ?? true,
        done: false,
        answerText: null,
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
    description?: string | null;
    dueAt?: Date | null;
    lineItems: { description: string; quantity: number; unitAmountCents: number }[];
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
      templateKey: null,
      createdAt: now,
      updatedAt: now,
      closedAt: null,
    };
    store().links.push(link);
    const amountCents = input.lineItems.reduce(
      (sum, li) => sum + li.quantity * li.unitAmountCents,
      0,
    );
    const invoice: Invoice = {
      id: newId("inv"),
      linkId: link.id,
      amountCents,
      currency: "usd",
      description: input.description ?? null,
      dueAt: input.dueAt ?? null,
      status: "open",
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      paidAt: null,
      paidManually: false,
      createdAt: now,
      updatedAt: now,
    };
    store().invoices.push(invoice);
    input.lineItems.forEach((li, i) => {
      store().invoiceLineItems.push({
        id: newId("ili"),
        invoiceId: invoice.id,
        description: li.description,
        quantity: li.quantity,
        unitAmountCents: li.unitAmountCents,
        position: i,
      });
    });
    return { link, invoice };
  },

  duplicateLink(linkId: string) {
    const link = demoStore.getLinkById(linkId);
    if (!link) return null;
    if (link.type === "checklist") {
      const items = demoStore.getItemsForLink(linkId).map((i) => ({
        label: i.label,
        itemType: i.itemType,
        required: i.required,
      }));
      return demoStore.createChecklistLink({
        userId: link.userId,
        title: `${link.title} (copy)`,
        clientEmail: link.clientEmail,
        items,
        templateKey: link.templateKey,
      });
    }
    const inv = demoStore.getInvoiceByLinkId(linkId);
    if (!inv) return null;
    const lines = demoStore.getLineItems(inv.id).map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unitAmountCents: li.unitAmountCents,
    }));
    return demoStore.createInvoiceLink({
      userId: link.userId,
      title: `${link.title} (copy)`,
      clientEmail: link.clientEmail,
      description: inv.description,
      dueAt: inv.dueAt,
      lineItems: lines,
    }).link;
  },

  updateLinkStatus(id: string, status: Link["status"]) {
    const link = demoStore.getLinkById(id);
    if (!link) return null;
    link.status = status;
    link.updatedAt = new Date();
    if (status === "closed" || status === "disabled" || status === "archived") {
      link.closedAt = new Date();
    } else {
      link.closedAt = null;
    }
    return link;
  },

  getItemsForLink: (linkId: string) =>
    store()
      .checklistItems.filter((i) => i.linkId === linkId)
      .sort((a, b) => a.position - b.position),

  updateItem(
    itemId: string,
    patch: Partial<Pick<ChecklistItem, "done" | "answerText">>,
  ) {
    const item = store().checklistItems.find((i) => i.id === itemId);
    if (!item) return null;
    if (patch.done !== undefined) {
      item.done = patch.done;
      item.doneAt = patch.done ? new Date() : null;
    }
    if (patch.answerText !== undefined) {
      item.answerText = patch.answerText;
      if (item.itemType === "text" && patch.answerText?.trim()) {
        item.done = true;
        item.doneAt = new Date();
      }
    }
    return item;
  },

  toggleItem(itemId: string, done: boolean) {
    return demoStore.updateItem(itemId, { done });
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
    if (input.checklistItemId) {
      demoStore.updateItem(input.checklistItemId, { done: true });
    }
    return row;
  },

  getFilesForLink: (linkId: string) =>
    store().files.filter((f) => f.linkId === linkId),

  storageUsedByUser(userId: string) {
    const linkIds = new Set(
      store().links.filter((l) => l.userId === userId).map((l) => l.id),
    );
    return store()
      .files.filter((f) => linkIds.has(f.linkId))
      .reduce((sum, f) => sum + f.sizeBytes, 0);
  },

  getInvoices: () => store().invoices,
  getInvoiceByLinkId: (linkId: string) =>
    store().invoices.find((i) => i.linkId === linkId),
  getLineItems: (invoiceId: string) =>
    store()
      .invoiceLineItems.filter((i) => i.invoiceId === invoiceId)
      .sort((a, b) => a.position - b.position),

  markInvoicePaid(
    linkId: string,
    opts?: { paymentIntentId?: string | null; manual?: boolean },
  ) {
    const inv = demoStore.getInvoiceByLinkId(linkId);
    if (!inv) return null;
    inv.status = "paid";
    inv.paidAt = new Date();
    inv.paidManually = Boolean(opts?.manual);
    inv.stripePaymentIntentId =
      opts?.paymentIntentId ?? inv.stripePaymentIntentId;
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
