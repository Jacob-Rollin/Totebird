"use client";

import { useAuth } from "@clerk/nextjs";
import { ClientAppNav } from "@/components/client-app-nav";
import { SessionLink } from "@/components/session-link";
import { SoftBoundary } from "@/components/soft-boundary";
import { TotebirdLogo } from "@/components/logo";

const CTA = {
  signIn: { guest: "/sign-in", signedIn: "/app" },
  startFree: { guest: "/sign-up", signedIn: "/app" },
} as const;

/**
 * Landing sticky header: AppNav when signed in; marketing CTAs when guest.
 * Client Clerk only — safe for force-static `/`.
 */
export function LandingHeader({ clerkEnabled }: { clerkEnabled: boolean }) {
  if (!clerkEnabled) {
    return <GuestLandingHeader clerkEnabled={false} />;
  }

  return (
    <SoftBoundary fallback={<GuestLandingHeader clerkEnabled={false} />}>
      <AuthAwareLandingHeader clerkEnabled />
    </SoftBoundary>
  );
}

function AuthAwareLandingHeader({ clerkEnabled }: { clerkEnabled: boolean }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (isLoaded && isSignedIn) {
    return <ClientAppNav />;
  }

  return <GuestLandingHeader clerkEnabled={clerkEnabled} />;
}

function GuestLandingHeader({ clerkEnabled }: { clerkEnabled: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--tb-line)]/70 bg-[color:var(--tb-mist)]/85 backdrop-blur-md">
      <div className="tb-shell flex items-center justify-between gap-4 py-3">
        <TotebirdLogo size="sm" variant="header" />
        <nav className="hidden items-center gap-6 text-sm font-medium text-[color:var(--tb-slate-soft)] md:flex">
          <a href="#how" className="hover:text-[color:var(--tb-ink)]">
            How it works
          </a>
          <a href="#product" className="hover:text-[color:var(--tb-ink)]">
            Product
          </a>
          <a href="#pricing" className="hover:text-[color:var(--tb-ink)]">
            Pricing
          </a>
          <a href="#faq" className="hover:text-[color:var(--tb-ink)]">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <SessionLink
            clerkEnabled={clerkEnabled}
            whenGuest={CTA.signIn.guest}
            whenSignedIn={CTA.signIn.signedIn}
            signedInLabel="Dashboard"
            className="tb-btn tb-btn-ghost hidden sm:inline-flex text-sm"
          >
            Sign in
          </SessionLink>
          <SessionLink
            clerkEnabled={clerkEnabled}
            whenGuest={CTA.startFree.guest}
            whenSignedIn={CTA.startFree.signedIn}
            signedInLabel="Open app"
            className="tb-btn tb-btn-primary text-sm px-4 py-2"
          >
            Start free
          </SessionLink>
        </div>
      </div>
    </header>
  );
}
