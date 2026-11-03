import { adminEmails, adminUserIds } from "@/lib/env";
import type { SessionUser } from "@/lib/auth";

export function isAdminEmailOrId(email: string, clerkId?: string | null) {
  const emails = adminEmails();
  if (emails.includes(email.toLowerCase())) return true;
  if (clerkId && adminUserIds().includes(clerkId)) return true;
  return false;
}

export function requireAdmin(session: SessionUser | null): session is SessionUser {
  if (!session) return false;
  // Honor session.isAdmin when already resolved (e.g. requireSession).
  if (session.isAdmin) return true;
  return isAdminEmailOrId(session.email, session.clerkId);
}
