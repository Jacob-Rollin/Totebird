export type Plan = "free" | "solo" | "studio";
export type PaidPlan = Exclude<Plan, "free">;

/** studio > solo > free — used when a customer somehow has multiple active subs. */
export const PLAN_RANK: Record<Plan, number> = {
  free: 0,
  solo: 1,
  studio: 2,
};

export function isPaidPlan(plan: Plan): plan is PaidPlan {
  return plan === "solo" || plan === "studio";
}

export function maxPlan(a: Plan, b: Plan): Plan {
  return PLAN_RANK[a] >= PLAN_RANK[b] ? a : b;
}

export function comparePlans(a: Plan, b: Plan): number {
  return PLAN_RANK[a] - PLAN_RANK[b];
}

export const PLAN_LIMITS: Record<
  Plan,
  {
    activeLinks: number;
    storageBytes: number;
    label: string;
    priceMonthly: number;
    priceYearly: number;
    features: string[];
  }
> = {
  free: {
    activeLinks: 3,
    storageBytes: 250 * 1024 * 1024,
    label: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "3 active links",
      "250 MB storage",
      "Manual reminders",
      "“Powered by Totebird”",
    ],
  },
  solo: {
    activeLinks: 25,
    storageBytes: 25 * 1024 * 1024 * 1024,
    label: "Solo",
    priceMonthly: 19,
    priceYearly: 190,
    features: [
      "25 active links",
      "25 GB storage",
      "Auto reminders",
      "Custom branding",
      "No invoice platform fee",
    ],
  },
  studio: {
    activeLinks: Number.POSITIVE_INFINITY,
    storageBytes: 100 * 1024 * 1024 * 1024,
    label: "Studio",
    priceMonthly: 39,
    priceYearly: 390,
    features: [
      "Unlimited links (fair use)",
      "100 GB storage",
      "White-label",
      "Seats coming later",
    ],
  },
};

export function canCreateLink(plan: Plan, activeCount: number) {
  return activeCount < PLAN_LIMITS[plan].activeLinks;
}

/** App-enforced plan storage cap (Free 250MB / Solo 25GB / Studio 100GB). */
export function canAcceptUpload(
  plan: Plan,
  usedBytes: number,
  incomingBytes: number,
) {
  return usedBytes + incomingBytes <= PLAN_LIMITS[plan].storageBytes;
}

export function formatStorage(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(0)} GB`;
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function storageUsageMessage(usedBytes: number, plan: Plan) {
  const cap = PLAN_LIMITS[plan].storageBytes;
  return `${formatStorage(usedBytes)} of ${formatStorage(cap)} used`;
}

/**
 * Progress is driven by required items only.
 * Optional items never block 100% / checklist complete when empty.
 * `required` null/undefined is treated as required (safe default).
 */
export function checklistProgress(
  items: { done: boolean; required?: boolean | null }[],
) {
  if (!items.length) return { done: 0, total: 0, percent: 0 };
  const required = items.filter((i) => i.required !== false);
  if (!required.length) {
    // All optional → complete for progress / status purposes
    return { done: 0, total: 0, percent: 100 };
  }
  const done = required.filter((i) => i.done).length;
  return {
    done,
    total: required.length,
    percent: Math.round((done / required.length) * 100),
  };
}

export function checklistRequiredComplete(
  items: { done: boolean; required?: boolean | null }[],
) {
  if (!items.length) return false;
  return checklistProgress(items).percent >= 100;
}

export function checklistProgressLabel(progress: {
  done: number;
  total: number;
  percent: number;
}) {
  if (progress.total === 0) {
    return progress.percent >= 100 ? "Complete" : "No items";
  }
  return `${progress.done} of ${progress.total} required`;
}
