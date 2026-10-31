/**
 * Stripe Connect (Express) — freelancer invoice payouts via Direct charges.
 *
 * When STRIPE_CONNECT_ENABLED=true: invoice Checkout requires a connected
 * account with charges_enabled (never falls back to the platform balance).
 * Free plan: application_fee_amount from STRIPE_PLATFORM_FEE_BPS (default 1%).
 * Solo/Studio: 0 platform fee.
 */

import { appUrl, isStripeConnectEnabled, hasStripe } from "@/lib/env";
import { getStripe } from "@/lib/stripe-client";

export const CONNECT_REQUIRED_MESSAGE =
  "Connect Stripe in Settings before sending invoices.";

export const CONNECT_NOT_ENABLED_MESSAGE =
  "Stripe Connect is not enabled on this site yet. Set STRIPE_CONNECT_ENABLED=true after Dashboard Connect setup.";

export type ConnectUiState =
  | "not_connected"
  | "pending"
  | "ready"
  | "disabled";

export type ConnectAccountStatus = {
  enabled: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  /** Compact label for Settings / New invoice */
  state: ConnectUiState;
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
      state: "disabled",
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
      state: "disabled",
      message: CONNECT_NOT_ENABLED_MESSAGE,
    };
  }

  if (!accountId) {
    return {
      enabled: true,
      accountId: null,
      chargesEnabled: false,
      detailsSubmitted: false,
      state: "not_connected",
      message:
        "Not connected — connect Stripe Express to receive client invoice payments.",
    };
  }

  if (!user.stripeConnectChargesEnabled) {
    return {
      enabled: true,
      accountId,
      chargesEnabled: false,
      detailsSubmitted: Boolean(user.stripeConnectDetailsSubmitted),
      state: "pending",
      message:
        "Pending — finish Stripe onboarding so charges are enabled, then clients can pay you.",
    };
  }

  return {
    enabled: true,
    accountId,
    chargesEnabled: true,
    detailsSubmitted: Boolean(user.stripeConnectDetailsSubmitted),
    state: "ready",
    message: "Ready to receive payments — client invoices settle to your Stripe.",
  };
}

/** True when Connect is on and this user can take Direct invoice charges. */
export function isConnectReadyForInvoices(user: {
  stripeConnectAccountId?: string | null;
  stripeConnectChargesEnabled?: boolean | null;
}): boolean {
  return (
    isStripeConnectEnabled() &&
    Boolean(user.stripeConnectAccountId) &&
    Boolean(user.stripeConnectChargesEnabled)
  );
}

/**
 * Gate payable invoices when Connect is required.
 * - Flag on + not ready → hard block (never charge the platform).
 * - Flag off → soft: allow platform Checkout only in demo / non-Connect mode.
 */
export function invoiceConnectGate(user: {
  stripeConnectAccountId?: string | null;
  stripeConnectChargesEnabled?: boolean | null;
}): {
  ok: boolean;
  connectReady: boolean;
  connectAccountId: string | null;
  message: string | null;
  soft: boolean;
} {
  if (!isStripeConnectEnabled()) {
    return {
      ok: true,
      connectReady: false,
      connectAccountId: null,
      message: CONNECT_NOT_ENABLED_MESSAGE,
      soft: true,
    };
  }

  if (isConnectReadyForInvoices(user)) {
    return {
      ok: true,
      connectReady: true,
      connectAccountId: user.stripeConnectAccountId!,
      message: null,
      soft: false,
    };
  }

  return {
    ok: false,
    connectReady: false,
    connectAccountId: null,
    message: CONNECT_REQUIRED_MESSAGE,
    soft: false,
  };
}

/** Create (or reuse) an Express account and return an Account Link URL. */
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
