/**
 * Stripe Connect (Express) — scaffold for freelancer invoice payouts.
 *
 * Recommendation: Direct charges on Express accounts + application_fee on Free.
 * See docs/stripe-integration-plan.md (Project store).
 *
 * Safe without live keys: all mutations no-op / return clear messages unless
 * STRIPE_CONNECT_ENABLED=true and STRIPE_SECRET_KEY is set.
 */

import { appUrl, isStripeConnectEnabled, hasStripe } from "@/lib/env";
import { getStripe } from "@/lib/stripe-client";

export type ConnectAccountStatus = {
  enabled: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  /** Human-readable next step for Settings UI */
  message: string;
};

export function connectFeatureStatus(user: {
  stripeConnectAccountId?: string | null;
  stripeConnectChargesEnabled?: boolean | null;
  stripeConnectDetailsSubmitted?: boolean | null;
}): ConnectAccountStatus {
  const flag = isStripeConnectEnabled();
  const accountId = user.stripeConnectAccountId ?? null;

  if (!hasStripe()) {
    return {
      enabled: false,
      accountId,
      chargesEnabled: false,
      detailsSubmitted: false,
      message:
        "Stripe is not configured. Add STRIPE_SECRET_KEY (Test mode) in Netlify / .env.local.",
    };
  }

  if (!flag) {
    return {
      enabled: false,
      accountId,
      chargesEnabled: Boolean(user.stripeConnectChargesEnabled),
      detailsSubmitted: Boolean(user.stripeConnectDetailsSubmitted),
      message:
        "Connect is scaffolded but off. After Dashboard Connect setup, set STRIPE_CONNECT_ENABLED=true.",
    };
  }

  if (!accountId) {
    return {
      enabled: true,
      accountId: null,
      chargesEnabled: false,
      detailsSubmitted: false,
      message: "Connect your Stripe Express account to receive invoice payments.",
    };
  }

  if (!user.stripeConnectChargesEnabled) {
    return {
      enabled: true,
      accountId,
      chargesEnabled: false,
      detailsSubmitted: Boolean(user.stripeConnectDetailsSubmitted),
      message:
        "Finish Stripe onboarding so charges are enabled, then clients can pay you directly.",
    };
  }

  return {
    enabled: true,
    accountId,
    chargesEnabled: true,
    detailsSubmitted: Boolean(user.stripeConnectDetailsSubmitted),
    message: "Stripe Connect ready — invoice Checkout can use Direct charges.",
  };
}

/**
 * Create (or reuse) an Express account and return an Account Link URL.
 * TODO(Phase 3): wire country/email from session; handle refresh/return URLs in UI.
 */
export async function createExpressOnboardingLink(input: {
  userId: string;
  email: string;
  existingAccountId?: string | null;
}): Promise<{
  ok: boolean;
  demo: boolean;
  url: string | null;
  accountId: string | null;
  message: string;
}> {
  if (!isStripeConnectEnabled()) {
    return {
      ok: false,
      demo: true,
      url: null,
      accountId: input.existingAccountId ?? null,
      message:
        "STRIPE_CONNECT_ENABLED is not true. Enable Connect in Stripe Dashboard (Test), then set the flag.",
    };
  }

  const stripe = getStripe();
  if (!stripe) {
    return {
      ok: false,
      demo: true,
      url: null,
      accountId: null,
      message: "Stripe is not configured.",
    };
  }

  let accountId = input.existingAccountId ?? null;

  if (!accountId) {
    // Express account — Stripe-hosted onboarding (best free-tier MVP path)
    const account = await stripe.accounts.create({
      type: "express",
      email: input.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { totebirdUserId: input.userId },
      business_profile: {
        product_description: "Freelance services invoiced via Totebird",
      },
    });
    accountId = account.id;
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl()}/app/settings?connect=refresh`,
    return_url: `${appUrl()}/app/settings?connect=return`,
    type: "account_onboarding",
  });

  return {
    ok: true,
    demo: false,
    url: link.url,
    accountId,
    message: "Redirecting to Stripe Express onboarding.",
  };
}

/** Refresh Express account flags from Stripe (call on return URL / webhook). */
export async function refreshConnectAccount(accountId: string): Promise<{
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
} | null> {
  const stripe = getStripe();
  if (!stripe || !accountId) return null;
  const account = await stripe.accounts.retrieve(accountId);
  return {
    chargesEnabled: Boolean(account.charges_enabled),
    detailsSubmitted: Boolean(account.details_submitted),
    payoutsEnabled: Boolean(account.payouts_enabled),
  };
}

/**
 * Sync Connect account from webhook `account.updated`.
 * Caller persists via updateUserModeration / dedicated updater.
 */
export function parseConnectAccountEvent(account: {
  id?: string;
  charges_enabled?: boolean;
  details_submitted?: boolean;
  metadata?: { totebirdUserId?: string };
}) {
  return {
    accountId: account.id ?? null,
    userId: account.metadata?.totebirdUserId ?? null,
    chargesEnabled: Boolean(account.charges_enabled),
    detailsSubmitted: Boolean(account.details_submitted),
  };
}
