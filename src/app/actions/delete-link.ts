"use server";

import { requireAdmin } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { getLinkById, hardDeleteLink } from "@/lib/data";

export type DeleteLinkResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Owner or founder admin may permanently delete a checklist/invoice link
 * (DB rows + B2 objects). Soft Close/Archive/Disable stay separate.
 */
export async function deleteLinkPermanently(
  linkId: string,
): Promise<DeleteLinkResult> {
  const session = await requireSession();
  if (!session) {
    return { ok: false, error: "Sign in required" };
  }

  const id = typeof linkId === "string" ? linkId.trim() : "";
  if (!id) {
    return { ok: false, error: "Missing link id" };
  }

  const link = await getLinkById(id);
  if (!link) {
    return { ok: false, error: "Link not found" };
  }

  const isOwner = link.userId === session.id;
  const isAdmin = requireAdmin(session);
  if (!isOwner && !isAdmin) {
    return { ok: false, error: "Not allowed" };
  }

  const result = await hardDeleteLink(id);
  if (!result.ok) {
    return { ok: false, error: result.error ?? "Could not delete link" };
  }
  return { ok: true };
}
