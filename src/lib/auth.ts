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

export async function requireSession(): Promise<SessionUser | null> {
  if (isDemoMode() || !hasClerk()) {
    return demoSession();
  }

  const { userId } = await auth();
  if (!userId) return null;

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
