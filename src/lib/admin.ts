import { adminEmails, adminUserIds, isDemoMode } from "@/lib/env";
import type { SessionUser } from "@/lib/auth";

export function isAdminEmailOrId(email: string, clerkId?: string | null) {
  if (isDemoMode() && !adminEmails().length && !adminUserIds().length) {
    return true;
  }
  const emails = adminEmails();
  if (emails.includes(email.toLowerCase())) return true;
  if (clerkId && adminUserIds().includes(clerkId)) return true;
  return false;
}

export function requireAdmin(session: SessionUser | null): session is SessionUser {
  if (!session) return false;
  return isAdminEmailOrId(session.email, session.clerkId);
}
