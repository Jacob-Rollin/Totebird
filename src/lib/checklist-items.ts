import type { CreateItemInput } from "@/db/demo-store";
import { getTemplate, type TemplateItem } from "@/lib/templates";

export type ItemType = "checkbox" | "text" | "file";

export type BuilderItem = {
  id: string;
  label: string;
  itemType: ItemType;
  required: boolean;
};

export const ITEM_TYPE_OPTIONS: {
  value: ItemType;
  label: string;
  hint: string;
}[] = [
  {
    value: "checkbox",
    label: "Checkbox",
    hint: "Client ticks this off when done",
  },
  {
    value: "text",
    label: "Short answer",
    hint: "Client types a short reply",
  },
  {
    value: "file",
    label: "File upload",
    hint: "Client will upload a file",
  },
];

export function newBuilderItemId() {
  return `item-${Math.random().toString(36).slice(2, 10)}`;
}

export function defaultBuilderItems(): BuilderItem[] {
  return [
    {
      id: newBuilderItemId(),
      label: "Logo (SVG or PNG)",
      itemType: "file",
      required: true,
    },
    {
      id: newBuilderItemId(),
      label: "Brand colors",
      itemType: "text",
      required: true,
    },
    {
      id: newBuilderItemId(),
      label: "Fonts in use",
      itemType: "text",
      required: false,
    },
  ];
}

export function templateItemsToBuilder(items: TemplateItem[]): BuilderItem[] {
  return items.map((i) => ({
    id: newBuilderItemId(),
    label: i.label,
    itemType: i.itemType,
    required: i.required ?? true,
  }));
}

/** Serialize builder rows to the legacy one-per-line syntax (advanced edit). */
export function builderToText(items: BuilderItem[]): string {
  return items
    .map((i) => {
      const flag = i.itemType === "checkbox" ? "" : ` [${i.itemType}]`;
      const req = i.required ? "" : " (optional)";
      return `${i.label.trim()}${flag}${req}`;
    })
    .filter((line) => line.trim())
    .join("\n");
}

/** Parse legacy one-per-line syntax into builder rows. */
export function textToBuilder(raw: string, templateKey = ""): BuilderItem[] {
  return parseItems(raw, templateKey).map((i) => ({
    id: newBuilderItemId(),
    label: i.label,
    itemType: i.itemType ?? "checkbox",
    required: i.required ?? true,
  }));
}

export function parseItems(raw: string, templateKey: string): CreateItemInput[] {
  const template = templateKey ? getTemplate(templateKey) : null;
  if (template && !raw.trim()) {
    return template.items.map((i) => ({
      label: i.label,
      itemType: i.itemType,
      required: i.required ?? true,
    }));
  }

  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      let itemType: CreateItemInput["itemType"] = "checkbox";
      let required = true;
      let label = line;
      if (/\(optional\)/i.test(label)) {
        required = false;
        label = label.replace(/\(optional\)/i, "").trim();
      }
      const typeMatch = label.match(/\[(text|file|checkbox)\]/i);
      if (typeMatch) {
        itemType = typeMatch[1].toLowerCase() as CreateItemInput["itemType"];
        label = label.replace(typeMatch[0], "").trim();
      }
      const fromTemplate = template?.items.find(
        (i) => i.label.toLowerCase() === label.toLowerCase(),
      );
      if (fromTemplate) {
        return {
          label: fromTemplate.label,
          itemType: fromTemplate.itemType,
          required: fromTemplate.required ?? true,
        };
      }
      return { label, itemType, required };
    });
}

export function parseItemsJson(raw: string): CreateItemInput[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const items: CreateItemInput[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const label = String(r.label || "").trim();
      if (!label) continue;
      const typeRaw = String(r.itemType || "checkbox").toLowerCase();
      const itemType: ItemType =
        typeRaw === "text" || typeRaw === "file" || typeRaw === "checkbox"
          ? typeRaw
          : "checkbox";
      const required =
        typeof r.required === "boolean"
          ? r.required
          : String(r.required).toLowerCase() !== "false";
      items.push({ label, itemType, required });
    }
    return items;
  } catch {
    return null;
  }
}
