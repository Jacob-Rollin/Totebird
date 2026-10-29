import { auth, currentUser } from "@clerk/nextjs/server";
import { ensureUser, getUserByClerkId, type User } from "@/lib/data";
import { hasClerk, isDemoMode } from "@/lib/env";

export type SessionUser = User & { isAdmin: boolean };

async function demoSession(): Promise<SessionUser> {
  const user = await ensureUser({
    clerkId: "user_demo",
    email: "demo@totebird.local",
    name: "Demo Freelancer",
  });
  return { ...user, isAdmin: true };
}

/**
 * Resolve the current freelancer session.
 * Soft-fails Clerk/DB explosions (www domain allowlist, Neon blips) so
 * layouts never 500 into error.tsx after Stripe Checkout return.
 */
export async function requireSession(): Promise<SessionUser | null> {
  try {
    if (isDemoMode() || !hasClerk()) {
      return demoSession();
    }

    let userId: string | null = null;
    try {
      const authState = await auth();
      userId = authState.userId;
    } catch (err) {
      console.error("[totebird] auth() failed in requireSession", err);
      const { databaseLooksUsable } = await import("@/lib/data");
      if (!(await databaseLooksUsable())) return demoSession();
      return null;
    }

    if (!userId) {
      // Clerk is configured but the visitor isn't signed in. If Neon isn't
      // usable yet (common before local `db:push`), keep /demo → /app working
      // via the seeded demo session instead of a hard sign-in wall.
      const { databaseLooksUsable } = await import("@/lib/data");
      if (!(await databaseLooksUsable())) return demoSession();
      return null;
    }

    const clerkUser = await currentUser();
    const email =
      clerkUser?.primaryEmailAddress?.emailAddress ||
      clerkUser?.emailAddresses?.[0]?.emailAddress;
    if (!email) return null;

    const user = await ensureUser({
      clerkId: userId,
      email,
      name: clerkUser?.fullName || clerkUser?.firstName || null,
    });

    if (user.disabled) return null;

    const { isAdminEmailOrId } = await import("@/lib/admin");
    return {
      ...user,
      isAdmin: isAdminEmailOrId(user.email, user.clerkId),
    };
  } catch (err) {
    console.error("[totebird] requireSession failed", err);
    try {
      if (isDemoMode() || !hasClerk()) return demoSession();
      const { databaseLooksUsable } = await import("@/lib/data");
      if (!(await databaseLooksUsable())) return demoSession();
    } catch {
      /* ignore nested failures */
    }
    return null;
  }
}

export async function getOptionalSession(): Promise<SessionUser | null> {
  try {
    return await requireSession();
  } catch {
    return null;
  }
}

export async function getDbUserFromClerkId(clerkId: string) {
  return getUserByClerkId(clerkId);
}
