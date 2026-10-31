export type TemplateItem = {
  label: string;
  itemType: "checkbox" | "text" | "file";
  required?: boolean;
};

export type ChecklistTemplate = {
  key: string;
  name: string;
  description: string;
  items: TemplateItem[];
};

export const CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
  {
    key: "web-design-kickoff",
    name: "Web design kickoff",
    description: "Brand, content, and access for a new site build.",
    items: [
      { label: "Logo (SVG or PNG)", itemType: "file", required: true },
      { label: "Brand colors (hex)", itemType: "text", required: true },
      { label: "Fonts in use", itemType: "text", required: false },
      { label: "Sitemap / page list approved", itemType: "checkbox", required: true },
      { label: "Domain registrar login shared", itemType: "checkbox", required: false },
      { label: "Reference sites (URLs)", itemType: "text", required: false },
    ],
  },
  {
    key: "logo-pack",
    name: "Logo pack",
    description: "Collect marks and usage notes for brand work.",
    items: [
      { label: "Primary logo file", itemType: "file", required: true },
      { label: "Icon / favicon mark", itemType: "file", required: true },
      { label: "Clear-space / usage notes", itemType: "text", required: false },
      { label: "Approved color variants", itemType: "checkbox", required: true },
    ],
  },
  {
    key: "video-project",
    name: "Video project",
    description: "Footage, audio, and approvals for a video job.",
    items: [
      { label: "Shot list confirmed", itemType: "checkbox", required: true },
      { label: "Raw footage upload", itemType: "file", required: true },
      { label: "Music / VO files", itemType: "file", required: false },
      { label: "Brand guidelines link", itemType: "text", required: false },
      { label: "Final cut approved", itemType: "checkbox", required: true },
    ],
  },
];

export function getTemplate(key: string) {
  return CHECKLIST_TEMPLATES.find((t) => t.key === key) ?? null;
}

export type DuePreset = {
  key: string;
  label: string;
  daysFromNow: number | null;
};

export const DUE_PRESETS: DuePreset[] = [
  { key: "upon-receipt", label: "Due on receipt", daysFromNow: 0 },
  { key: "net-7", label: "Due in 7 days", daysFromNow: 7 },
  { key: "net-14", label: "Due in 14 days", daysFromNow: 14 },
  { key: "net-30", label: "Due in 30 days", daysFromNow: 30 },
  { key: "custom", label: "Custom date", daysFromNow: null },
];

export function dueDateFromPreset(key: string, customDate?: string | null) {
  if (key === "custom" && customDate) return new Date(customDate);
  const preset = DUE_PRESETS.find((p) => p.key === key);
  if (!preset || preset.daysFromNow === null) return null;
  const d = new Date();
  d.setHours(23, 59, 59, 0);
  d.setDate(d.getDate() + preset.daysFromNow);
  return d;
}
