"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CHECKLIST_TEMPLATES, DUE_PRESETS } from "@/lib/templates";
import {
  ITEM_TYPE_OPTIONS,
  builderToText,
  defaultBuilderItems,
  newBuilderItemId,
  templateItemsToBuilder,
  textToBuilder,
  type BuilderItem,
  type ItemType,
} from "@/lib/checklist-items";

type LineDraft = { description: string; quantity: string; amount: string };

export function CreateLinkForm({
  type,
  action,
  invoiceSubmitDisabled = false,
  invoiceDisabledHint = null,
}: {
  type: "checklist" | "invoice";
  action: (formData: FormData) => Promise<void>;
  /** When Connect is required but the freelancer is not ready */
  invoiceSubmitDisabled?: boolean;
  invoiceDisabledHint?: string | null;
}) {
  const [templateKey, setTemplateKey] = useState("");
  const [items, setItems] = useState<BuilderItem[]>(() => defaultBuilderItems());
  const [editAsText, setEditAsText] = useState(false);
  const [itemsText, setItemsText] = useState(() =>
    builderToText(defaultBuilderItems()),
  );
  const [duePreset, setDuePreset] = useState("net-7");
  const [lines, setLines] = useState<LineDraft[]>([
    { description: "Project deposit", quantity: "1", amount: "1500.00" },
  ]);

  const template = useMemo(
    () => CHECKLIST_TEMPLATES.find((t) => t.key === templateKey),
    [templateKey],
  );

  const itemsJson = useMemo(
    () =>
      JSON.stringify(
        items.map(({ label, itemType, required }) => ({
          label,
          itemType,
          required,
        })),
      ),
    [items],
  );

  function syncTextFromBuilder(next: BuilderItem[]) {
    setItemsText(builderToText(next));
  }

  function applyTemplate(key: string) {
    setTemplateKey(key);
    const t = CHECKLIST_TEMPLATES.find((x) => x.key === key);
    if (!t) {
      const blank = defaultBuilderItems();
      setItems(blank);
      syncTextFromBuilder(blank);
      return;
    }
    const next = templateItemsToBuilder(t.items);
    setItems(next);
    syncTextFromBuilder(next);
    setEditAsText(false);
  }

  function updateItem(id: string, patch: Partial<BuilderItem>) {
    const next = items.map((row) => (row.id === id ? { ...row, ...patch } : row));
    setItems(next);
    syncTextFromBuilder(next);
  }

  function removeItem(id: string) {
    const next = items.filter((row) => row.id !== id);
    setItems(next.length ? next : [
      {
        id: newBuilderItemId(),
        label: "",
        itemType: "checkbox" as ItemType,
        required: true,
      },
    ]);
    syncTextFromBuilder(next.length ? next : [
      {
        id: "placeholder",
        label: "",
        itemType: "checkbox",
        required: true,
      },
    ]);
  }

  function addItem() {
    const next = [
      ...items,
      {
        id: newBuilderItemId(),
        label: "",
        itemType: "checkbox" as ItemType,
        required: true,
      },
    ];
    setItems(next);
    syncTextFromBuilder(next);
  }

  function toggleEditAsText() {
    if (!editAsText) {
      setItemsText(builderToText(items));
      setEditAsText(true);
      return;
    }
    const next = textToBuilder(itemsText, templateKey);
    setItems(
      next.length
        ? next
        : [
            {
              id: newBuilderItemId(),
              label: "",
              itemType: "checkbox",
              required: true,
            },
          ],
    );
    setEditAsText(false);
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="templateKey" value={templateKey} />
      <input type="hidden" name="duePreset" value={duePreset} />
      <input type="hidden" name="lineItemsJson" value={JSON.stringify(lines)} />
      {type === "checklist" && !editAsText && (
        <>
          <input type="hidden" name="itemsJson" value={itemsJson} />
          <input type="hidden" name="items" value={builderToText(items)} />
        </>
      )}

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
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="tb-label mb-0" id="items-heading">
                Checklist items
              </label>
              <button
                type="button"
                className="text-xs font-medium text-[color:var(--tb-slate-soft)] underline-offset-2 hover:underline"
                onClick={toggleEditAsText}
              >
                {editAsText ? "Use visual builder" : "Edit as text"}
              </button>
            </div>

            {editAsText ? (
              <>
                <label className="sr-only" htmlFor="items">
                  Items as text
                </label>
                <textarea
                  id="items"
                  name="items"
                  className="tb-textarea min-h-40"
                  required
                  value={itemsText}
                  onChange={(e) => setItemsText(e.target.value)}
                  aria-describedby="items-text-hint"
                />
                <p
                  id="items-text-hint"
                  className="mt-1 text-xs text-[color:var(--tb-slate-soft)]"
                >
                  One item per line. Optional advanced syntax: [text], [file],
                  (optional).
                </p>
              </>
            ) : (
              <div className="space-y-3" role="group" aria-labelledby="items-heading">
                {items.map((row, idx) => {
                  const hint =
                    ITEM_TYPE_OPTIONS.find((o) => o.value === row.itemType)
                      ?.hint || "";
                  return (
                    <div
                      key={row.id}
                      className="rounded-xl border border-[color:var(--tb-line)] bg-[color:var(--tb-mist)]/60 p-3"
                    >
                      <div className="grid gap-2 sm:grid-cols-[1fr_minmax(8.5rem,9.5rem)_auto_auto] sm:items-end">
                        <div>
                          <label
                            className="tb-label"
                            htmlFor={`item-label-${row.id}`}
                          >
                            Item {idx + 1}
                          </label>
                          <input
                            id={`item-label-${row.id}`}
                            className="tb-input"
                            placeholder="What should the client provide?"
                            value={row.label}
                            onChange={(e) =>
                              updateItem(row.id, { label: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div>
                          <label
                            className="tb-label"
                            htmlFor={`item-type-${row.id}`}
                          >
                            Type
                          </label>
                          <select
                            id={`item-type-${row.id}`}
                            className="tb-select"
                            value={row.itemType}
                            onChange={(e) =>
                              updateItem(row.id, {
                                itemType: e.target.value as ItemType,
                              })
                            }
                          >
                            {ITEM_TYPE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <label
                          className="flex items-center gap-2 pb-2.5 text-sm text-[color:var(--tb-slate)]"
                          htmlFor={`item-optional-${row.id}`}
                        >
                          <input
                            id={`item-optional-${row.id}`}
                            type="checkbox"
                            className="h-4 w-4 accent-[color:var(--tb-orange)]"
                            checked={!row.required}
                            onChange={(e) =>
                              updateItem(row.id, {
                                required: !e.target.checked,
                              })
                            }
                          />
                          Optional
                        </label>
                        <button
                          type="button"
                          className="pb-2.5 text-left text-sm text-rose-700 sm:text-center"
                          onClick={() => removeItem(row.id)}
                          disabled={items.length === 1}
                        >
                          Remove
                        </button>
                      </div>
                      {hint && (
                        <p className="mt-2 text-xs text-[color:var(--tb-slate-soft)]">
                          {hint}
                        </p>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  className="text-sm font-medium text-[color:var(--tb-orange-deep)]"
                  onClick={addItem}
                >
                  + Add item
                </button>
              </div>
            )}
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
              key="invoice-notes"
              className="tb-textarea min-h-20"
              defaultValue=""
              placeholder="Payment terms, scope notes…"
              autoComplete="off"
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
              <p className="mt-1 text-xs text-[color:var(--tb-slate-soft)]">
                When the client should pay.
              </p>
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

      <button
        type="submit"
        className="tb-btn tb-btn-primary w-full"
        disabled={type === "invoice" && invoiceSubmitDisabled}
      >
        Create {type} link
      </button>
      {type === "invoice" && invoiceSubmitDisabled && invoiceDisabledHint && (
        <p className="text-center text-sm text-rose-800">{invoiceDisabledHint}</p>
      )}
    </form>
  );
}
