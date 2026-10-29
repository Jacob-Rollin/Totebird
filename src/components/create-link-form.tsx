"use client";

import Link from "next/link";

export function CreateLinkForm({
  type,
  action,
}: {
  type: "checklist" | "invoice";
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="type" value={type} />

      <div className="flex gap-2 text-sm">
        <Link
          href="/app/links/new?type=checklist"
          className={`rounded-md px-3 py-1.5 ${
            type === "checklist"
              ? "bg-[color:var(--tb-orange-soft)] font-semibold text-[color:var(--tb-slate)]"
              : "text-[color:var(--tb-slate-soft)]"
          }`}
        >
          Checklist
        </Link>
        <Link
          href="/app/links/new?type=invoice"
          className={`rounded-md px-3 py-1.5 ${
            type === "invoice"
              ? "bg-[color:var(--tb-orange-soft)] font-semibold text-[color:var(--tb-slate)]"
              : "text-[color:var(--tb-slate-soft)]"
          }`}
        >
          Invoice
        </Link>
      </div>

      <div>
        <label className="tb-label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          className="tb-input"
          required
          placeholder={
            type === "invoice" ? "Website redesign deposit" : "Brand assets checklist"
          }
        />
      </div>

      <div>
        <label className="tb-label" htmlFor="clientEmail">
          Client email (optional, for reminders)
        </label>
        <input
          id="clientEmail"
          name="clientEmail"
          type="email"
          className="tb-input"
          placeholder="client@example.com"
        />
      </div>

      {type === "checklist" ? (
        <div>
          <label className="tb-label" htmlFor="items">
            Checklist items (one per line)
          </label>
          <textarea
            id="items"
            name="items"
            className="tb-textarea min-h-36"
            required
            placeholder={"Logo (SVG or PNG)\nBrand colors\nFonts in use"}
          />
        </div>
      ) : (
        <>
          <div>
            <label className="tb-label" htmlFor="amount">
              Amount (USD)
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              min="0.50"
              step="0.01"
              className="tb-input"
              required
              placeholder="1500.00"
            />
          </div>
          <div>
            <label className="tb-label" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              className="tb-textarea min-h-24"
              placeholder="50% deposit — website redesign"
            />
          </div>
          <div>
            <label className="tb-label" htmlFor="dueAt">
              Due date
            </label>
            <input id="dueAt" name="dueAt" type="date" className="tb-input" />
          </div>
        </>
      )}

      <button type="submit" className="tb-btn tb-btn-primary w-full">
        Create {type} link
      </button>
    </form>
  );
}
