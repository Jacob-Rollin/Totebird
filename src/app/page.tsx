import { LandingPage } from "@/components/landing";
import { hasClerkPublishable } from "@/lib/env-public";

/**
 * Marketing home — never call Clerk auth() here.
 * Session-aware CTAs resolve on the client via SessionLink so a domain
 * allowlist / secret mismatch cannot 500 guests (soft-fallback, same spirit as #10/#11).
 */
export default function Home() {
  return <LandingPage clerkEnabled={hasClerkPublishable()} />;
}
