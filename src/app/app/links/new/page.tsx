import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { canCreateLink } from "@/lib/plans";
import {
  countActiveLinks,
  createChecklistLink,
  createInvoiceLink,
} from "@/lib/data";
import { CreateLinkForm } from "@/components/create-link-form";
import { dueDateFromPreset } from "@/lib/templates";
import { parseItems, parseItemsJson } from "@/lib/checklist-items";

export const metadata = { title: "New link" };

export default async function NewLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; error?: string }>;
}) {
  const session = await requireSession();
  if (!session) redirect("/sign-in");

  const params = await searchParams;
  const type = params.type === "invoice" ? "invoice" : "checklist";
  const active = await countActiveLinks(session.id);
  if (!canCreateLink(session.plan, active)) {
    redirect("/app?limit=1");
  }

  async function createAction(formData: FormData) {
    "use server";
    const s = await requireSession();
    if (!s) redirect("/sign-in");

    const activeCount = await countActiveLinks(s.id);
    if (!canCreateLink(s.plan, activeCount)) {
      redirect("/app?limit=1");
    }

    const title = String(formData.get("title") || "").trim();
    const clientEmail = String(formData.get("clientEmail") || "").trim() || null;
    const linkType = String(formData.get("type") || "checklist");

    if (!title) redirect("/app/links/new");

    if (linkType === "invoice") {
      const description =
        String(formData.get("description") || "").trim() || null;
      const duePreset = String(formData.get("duePreset") || "net-7");
      const dueAtRaw = String(formData.get("dueAt") || "");
      let lineItems: {
        description: string;
        quantity: number;
        unitAmountCents: number;
      }[] = [];
      try {
        const parsed = JSON.parse(String(formData.get("lineItemsJson") || "[]"));
        lineItems = (parsed as { description: string; quantity: string; amount: string }[])
          .map((li) => ({
            description: String(li.description || "").trim(),
            quantity: Math.max(1, Number(li.quantity) || 1),
            unitAmountCents: Math.round(Number(li.amount) * 100),
          }))
          .filter((li) => li.description && li.unitAmountCents > 0);
      } catch {
        lineItems = [];
      }
      if (!lineItems.length) {
        redirect("/app/links/new?type=invoice&error=lines");
      }
      const link = await createInvoiceLink({
        userId: s.id,
        title,
        clientEmail,
        description,
        dueAt: dueDateFromPreset(duePreset, dueAtRaw),
        lineItems,
      });
      redirect(`/app/links/${link.id}`);
    }

    const templateKey = String(formData.get("templateKey") || "") || null;
    const fromJson = parseItemsJson(String(formData.get("itemsJson") || ""));
    const items =
      fromJson && fromJson.length
        ? fromJson
        : parseItems(String(formData.get("items") || ""), templateKey || "");
    if (!items.length) redirect("/app/links/new?type=checklist&error=items");

    const link = await createChecklistLink({
      userId: s.id,
      title,
      clientEmail,
      items,
      templateKey,
    });
    redirect(`/app/links/${link.id}`);
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-3xl">
        New {type === "invoice" ? "invoice" : "checklist"}
      </h1>
      <p className="mt-1 text-[color:var(--tb-slate-soft)]">
        Clients open a passwordless link — no account needed.
      </p>
      {params.error && (
        <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Please add at least one valid item or line.
        </p>
      )}
      <div className="tb-panel mt-8">
        <CreateLinkForm type={type} action={createAction} />
      </div>
    </div>
  );
}
