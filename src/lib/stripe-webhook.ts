import { hasStripe } from "@/lib/env";
import { getStripe } from "@/lib/stripe-client";

export function hasStripeSafe() {
  return hasStripe();
}

export { getStripe };
