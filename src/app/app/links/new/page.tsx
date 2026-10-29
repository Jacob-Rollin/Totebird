import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { canCreateLink } from "@/lib/plans";
import { countActiveLinks, createChecklistLink, createInvoiceLink } from "@/lib/data";
import { CreateLinkForm } from "@/components/create-link-form";

export const metadata = { title: "New link" };

export default async function NewLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await requireSession();
  if (!session) redirect("/sign-in");

  const params = await searchParams;
  const type = params.type === "invoice" ? "invoice" : "checklist";
  const active = await countActiveLinks(session.id);
  if (!canCreateLink(session.plan, active)) {
    redirect("/app");
  }

  async function createAction(formData: FormData) {
    "use server";
    const s = await requireSession();
    if (!s) redirect("/sign-in");

    const title = String(formData.get("title") || "").trim();
    const clientEmail = String(formData.get("clientEmail") || "").trim() || null;
    const linkType = String(formData.get("type") || "checklist");

    if (!title) redirect("/app/links/new");

    if (linkType === "invoice") {
      const amount = Number(formData.get("amount"));
      const description = String(formData.get("description") || "").trim() || null;
      const due = String(formData.get("dueAt") || "");
      const amountCents = Math.round(amount * 100);
      if (!Number.isFinite(amountCents) || amountCents < 50) {
        redirect("/app/links/new?type=invoice");
      }
      const link = await createInvoiceLink({
        userId: s.id,
        title,
        clientEmail,
        amountCents,
        description,
        dueAt: due ? new Date(due) : null,
      });
      redirect(`/app/links/${link.id}`);
    }

    const itemsRaw = String(formData.get("items") || "");
    const items = itemsRaw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!items.length) redirect("/app/links/new?type=checklist");

    const link = await createChecklistLink({
      userId: s.id,
      title,
      clientEmail,
      items,
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
      <div className="tb-panel mt-8">
        <CreateLinkForm type={type} action={createAction} />
      </div>
    </div>
  );
}
