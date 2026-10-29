import { hasStripe } from "@/lib/env";
import { getStripe } from "@/lib/stripe-client";

/**
 * Stripe webhook helpers for App Router on Netlify.
 * The route must call `await req.text()` (raw body) before constructEvent —
 * never `req.json()` first, or signature verification fails.
 */
export function hasStripeSafe() {
  return hasStripe();
}

export { getStripe };
