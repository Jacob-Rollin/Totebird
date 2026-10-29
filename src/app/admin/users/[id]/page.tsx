import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatusPill } from "@/components/status-pill";
import {
  getUserDetail,
  updateUserModeration,
} from "@/lib/data";
import { formatDate } from "@/lib/format";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getUserDetail(id);
  if (!detail) notFound();
  const { user, links } = detail;

  async function toggleDisable() {
    "use server";
    await updateUserModeration(id, { disabled: !user.disabled });
    redirect(`/admin/users/${id}`);
  }

  async function toggleFlag() {
    "use server";
    await updateUserModeration(id, {
      flagged: !user.flagged,
      flagReason: user.flagged ? null : "Flagged by founder admin",
    });
    redirect(`/admin/users/${id}`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/users" className="text-sm text-[color:var(--tb-slate-soft)]">
        ← Users
      </Link>
      <h1 className="font-display mt-4 text-3xl">{user.email}</h1>
      <p className="mt-1 text-[color:var(--tb-slate-soft)]">
        {user.name || "No name"} · joined {formatDate(user.createdAt)}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill status={user.plan} />
        {user.disabled && <StatusPill status="disabled" />}
        {user.flagged && <StatusPill status="overdue" />}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <form action={toggleDisable}>
          <button type="submit" className="tb-btn tb-btn-secondary text-sm">
            {user.disabled ? "Enable user" : "Disable user"}
          </button>
        </form>
        <form action={toggleFlag}>
          <button type="submit" className="tb-btn tb-btn-secondary text-sm">
            {user.flagged ? "Clear flag" : "Flag account"}
          </button>
        </form>
      </div>
      {user.flagReason && (
        <p className="mt-3 text-sm text-rose-700">{user.flagReason}</p>
      )}

      <div className="tb-panel mt-8 overflow-x-auto p-0">
        <table className="tb-card-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {links.map((l) => (
              <tr key={l.id}>
                <td>{l.title}</td>
                <td className="capitalize">{l.type}</td>
                <td>
                  <StatusPill status={l.status} />
                </td>
                <td>{formatDate(l.createdAt)}</td>
              </tr>
            ))}
            {links.length === 0 && (
              <tr>
                <td colSpan={4} className="text-[color:var(--tb-slate-soft)]">
                  No links
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
