"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import type { ComponentProps } from "react";

type SessionLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  /** Href when signed out / Clerk unavailable. */
  whenGuest: string;
  /** Href when Clerk reports an active session. */
  whenSignedIn: string;
  /** False → always use whenGuest (no useAuth; safe outside ClerkProvider). */
  clerkEnabled: boolean;
};

/**
 * Marketing CTAs that prefer guest hrefs on the server and only swap after
 * Clerk hydrates. Never calls server auth() — domain cutover / allowlist
 * misconfig must not 500 the landing page.
 */
export function SessionLink({
  whenGuest,
  whenSignedIn,
  clerkEnabled,
  ...props
}: SessionLinkProps) {
  if (!clerkEnabled) {
    return <Link href={whenGuest} {...props} />;
  }
  return (
    <ClerkSessionLink
      whenGuest={whenGuest}
      whenSignedIn={whenSignedIn}
      {...props}
    />
  );
}

function ClerkSessionLink({
  whenGuest,
  whenSignedIn,
  ...props
}: Omit<SessionLinkProps, "clerkEnabled">) {
  const { isSignedIn } = useAuth();
  return <Link href={isSignedIn ? whenSignedIn : whenGuest} {...props} />;
}
