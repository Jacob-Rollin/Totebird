export type Plan = "free" | "solo" | "studio";

export const PLAN_LIMITS: Record<
  Plan,
  { activeLinks: number; storageBytes: number; label: string }
> = {
  free: {
    activeLinks: 3,
    storageBytes: 250 * 1024 * 1024,
    label: "Free",
  },
  solo: {
    activeLinks: 25,
    storageBytes: 25 * 1024 * 1024 * 1024,
    label: "Solo",
  },
  studio: {
    activeLinks: Number.POSITIVE_INFINITY,
    storageBytes: 100 * 1024 * 1024 * 1024,
    label: "Studio",
  },
};

export function canCreateLink(plan: Plan, activeCount: number) {
  return activeCount < PLAN_LIMITS[plan].activeLinks;
}
