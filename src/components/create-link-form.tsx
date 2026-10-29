"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CHECKLIST_TEMPLATES, DUE_PRESETS } from "@/lib/templates";

type LineDraft = { description: string; quantity: string; amount: string };

export function CreateLinkForm({
  type,
  action,
}: {
  type: "checklist" | "invoice";
  action: (formData: FormData) => Promise<void>;
}) {
  const [templateKey, setTemplateKey] = useState("");
  const [itemsText, setItemsText] = useState(
    "Logo (SVG or PNG)\nBrand colors\nFonts in use",
  );
  const [duePreset, setDuePreset] = useState("net-7");
  const [lines, setLines] = useState<LineDraft[]>([
    { description: "Project deposit", quantity: "1", amount: "1500.00" },
  ]);

  const template = useMemo(
    () => CHECKLIST_TEMPLATES.find((t) => t.key === templateKey),
    [templateKey],
  );

  function applyTemplate(key: string) {
    setTemplateKey(key);
    const t = CHECKLIST_TEMPLATES.find((x) => x.key === key);
    if (!t) return;
    setItemsText(
      t.items
        .map((i) => {
          const flag = i.itemType === "checkbox" ? "" : ` [${i.itemType}]`;
          const req = i.required === false ? " (optional)" : "";
          return `${i.label}${flag}${req}`;
        })
        .join("\n"),
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="templateKey" value={templateKey} />
      <input type="hidden" name="duePreset" value={duePreset} />
      <input type="hidden" name="lineItemsJson" value={JSON.stringify(lines)} />

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
          defaultValue={
            type === "invoice"
              ? "Website redesign deposit"
              : template?.name || "Brand assets checklist"
          }
          key={`${type}-${templateKey}`}
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
        <>
          <div>
            <label className="tb-label" htmlFor="template">
              Template
            </label>
            <select
              id="template"
              className="tb-select"
              value={templateKey}
              onChange={(e) => applyTemplate(e.target.value)}
            >
              <option value="">Blank / custom</option>
              {CHECKLIST_TEMPLATES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
            {template && (
              <p className="mt-1 text-xs text-[color:var(--tb-slate-soft)]">
                {template.description}
              </p>
            )}
          </div>
          <div>
            <label className="tb-label" htmlFor="items">
              Items (one per line). Append [text] or [file]; “(optional)” for
              non-required.
            </label>
            <textarea
              id="items"
              name="items"
              className="tb-textarea min-h-40"
              required
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="tb-label">Line items</label>
            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="grid gap-2 sm:grid-cols-[1fr_72px_100px_auto]"
                >
                  <input
                    className="tb-input"
                    placeholder="Description"
                    value={line.description}
                    onChange={(e) => {
                      const next = [...lines];
                      next[idx] = { ...line, description: e.target.value };
                      setLines(next);
                    }}
                    required
                  />
                  <input
                    className="tb-input"
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => {
                      const next = [...lines];
                      next[idx] = { ...line, quantity: e.target.value };
                      setLines(next);
                    }}
                  />
                  <input
                    className="tb-input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Amount"
                    value={line.amount}
                    onChange={(e) => {
                      const next = [...lines];
                      next[idx] = { ...line, amount: e.target.value };
                      setLines(next);
                    }}
                    required
                  />
                  <button
                    type="button"
                    className="text-sm text-rose-700"
                    onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                    disabled={lines.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-3 text-sm font-medium text-[color:var(--tb-orange-deep)]"
              onClick={() =>
                setLines([
                  ...lines,
                  { description: "", quantity: "1", amount: "" },
                ])
              }
            >
              + Add line
            </button>
          </div>
          <div>
            <label className="tb-label" htmlFor="description">
              Notes (optional)
            </label>
            <textarea
              id="description"
              name="description"
              className="tb-textarea min-h-20"
              placeholder="Payment terms, scope notes…"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="tb-label" htmlFor="duePresetSelect">
                Due date
              </label>
              <select
                id="duePresetSelect"
                className="tb-select"
                value={duePreset}
                onChange={(e) => setDuePreset(e.target.value)}
              >
                {DUE_PRESETS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            {duePreset === "custom" && (
              <div>
                <label className="tb-label" htmlFor="dueAt">
                  Custom date
                </label>
                <input id="dueAt" name="dueAt" type="date" className="tb-input" />
              </div>
            )}
          </div>
        </>
      )}

      <button type="submit" className="tb-btn tb-btn-primary w-full">
        Create {type} link
      </button>
    </form>
  );
}
