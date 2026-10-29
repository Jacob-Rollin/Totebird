import Stripe from "stripe";
import { hasStripe } from "@/lib/env";

let cached: Stripe | null | undefined;

/** Shared Stripe SDK client (platform secret). Returns null when key missing. */
export function getStripe(): Stripe | null {
  if (!hasStripe()) return null;
  if (cached === undefined) {
    cached = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return cached;
}
