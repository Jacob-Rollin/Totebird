import { LandingPage } from "@/components/landing";
import { hasClerkPublishable } from "@/lib/env-public";

/**
 * Marketing home — never call Clerk auth() here.
 * Session-aware CTAs resolve on the client via SessionLink so a domain
 * allowlist / secret mismatch cannot 500 guests (soft-fallback, same spirit as #10/#11).
 *
 * Static + CDN-friendly: no cookies/auth() — Netlify can serve cached HTML
 * (see netlify.toml [[headers]] for `/`).
 */
export const dynamic = "force-static";

export default function Home() {
  return <LandingPage clerkEnabled={hasClerkPublishable()} />;
}
