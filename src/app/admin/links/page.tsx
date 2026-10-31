import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminFilter } from "@/components/admin-filter";
import { DeleteLinkButton } from "@/components/delete-link-button";
import { StatusPill } from "@/components/status-pill";
import { listAllLinks, updateLinkStatus } from "@/lib/data";
import { appUrl } from "@/lib/env";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Admin · Links" };

export default async function AdminLinksPage() {
  const links = await listAllLinks();
  const base = appUrl();

  async function disableLink(formData: FormData) {
    "use server";
    const id = String(formData.get("id") || "");
    if (!id) return;
    await updateLinkStatus(id, "disabled");
    redirect("/admin/links");
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Links</h1>
      <p className="mt-1 text-sm text-[color:var(--tb-slate-soft)]">
        Disable blocks guest access but keeps files (storage still counts).
        Delete permanently removes the link, related rows, and B2 objects.
      </p>
      <div className="mt-6">
        <AdminFilter placeholder="Filter by title, type, owner, status…">
          <div className="tb-panel overflow-x-auto p-0">
            <table className="tb-card-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Client URL</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {links.map((l) => {
                  const path =
                    l.type === "checklist" ? `/c/${l.token}` : `/i/${l.token}`;
                  return (
                    <tr key={l.id}>
                      <td className="font-medium">{l.title}</td>
                      <td className="capitalize">{l.type}</td>
                      <td className="text-sm">{l.ownerEmail}</td>
                      <td>
                        <StatusPill status={l.status} />
                      </td>
                      <td>{formatDate(l.createdAt)}</td>
                      <td>
                        <Link
                          href={path}
                          className="text-sm text-[color:var(--tb-orange-deep)]"
                          target="_blank"
                        >
                          Open
                        </Link>
                        <div className="max-w-[180px] truncate text-xs text-[color:var(--tb-slate-soft)]">
                          {base}
                          {path}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col items-end gap-1">
                          {l.status !== "disabled" && (
                            <form action={disableLink}>
                              <input type="hidden" name="id" value={l.id} />
                              <button
                                type="submit"
                                className="text-sm font-medium text-[color:var(--tb-slate-soft)] hover:underline"
                              >
                                Disable
                              </button>
                            </form>
                          )}
                          <DeleteLinkButton
                            linkId={l.id}
                            redirectTo="/admin/links"
                            variant="link"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {links.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-[color:var(--tb-slate-soft)]"
                    >
                      No links yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </AdminFilter>
      </div>
    </div>
  );
}
