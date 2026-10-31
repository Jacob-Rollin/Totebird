import type { Plan } from "@/lib/plans";

export function billingPriceId(
  plan: "solo" | "studio",
  interval: "month" | "year",
) {
  const map: Record<string, string | undefined> = {
    "solo:month": process.env.STRIPE_PRICE_SOLO_MONTHLY,
    "solo:year": process.env.STRIPE_PRICE_SOLO_YEARLY,
    "studio:month": process.env.STRIPE_PRICE_STUDIO_MONTHLY,
    "studio:year": process.env.STRIPE_PRICE_STUDIO_YEARLY,
  };
  return map[`${plan}:${interval}`] || null;
}

/** Map a Stripe Price ID back to Totebird plan (Customer Portal switches). */
export function planFromPriceId(priceId: string | null | undefined): Plan | null {
  if (!priceId) return null;
  const entries: [Plan, string | undefined][] = [
    ["solo", process.env.STRIPE_PRICE_SOLO_MONTHLY],
    ["solo", process.env.STRIPE_PRICE_SOLO_YEARLY],
    ["studio", process.env.STRIPE_PRICE_STUDIO_MONTHLY],
    ["studio", process.env.STRIPE_PRICE_STUDIO_YEARLY],
  ];
  for (const [plan, id] of entries) {
    if (id && id === priceId) return plan;
  }
  return null;
}

export function hasBillingPrices() {
  return Boolean(
    process.env.STRIPE_PRICE_SOLO_MONTHLY ||
      process.env.STRIPE_PRICE_SOLO_YEARLY ||
      process.env.STRIPE_PRICE_STUDIO_MONTHLY ||
      process.env.STRIPE_PRICE_STUDIO_YEARLY,
  );
}
