import Stripe from "stripe";
import { hasStripe } from "@/lib/env";

export function hasStripeSafe() {
  return hasStripe();
}

export function getStripe() {
  if (!hasStripe()) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}
