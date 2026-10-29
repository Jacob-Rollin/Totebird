import Link from "next/link";
import { AdminFilter } from "@/components/admin-filter";
import { StatusPill } from "@/components/status-pill";
import { listUsers } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Admin · Users" };

export default async function AdminUsersPage() {
  const users = await listUsers();

  return (
    <div>
      <h1 className="font-display text-3xl">Users</h1>
      <div className="mt-6">
        <AdminFilter placeholder="Filter by email, name, plan…">
          <div className="tb-panel overflow-x-auto p-0">
            <table className="tb-card-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Links</th>
                  <th>Flags</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="font-medium">{u.email}</div>
                      {u.name && (
                        <div className="text-xs text-[color:var(--tb-slate-soft)]">
                          {u.name}
                        </div>
                      )}
                    </td>
                    <td>
                      <StatusPill status={u.plan} />
                    </td>
                    <td>{u.linkCount}</td>
                    <td className="space-x-1">
                      {u.disabled && <StatusPill status="disabled" />}
                      {u.flagged && (
                        <span className="text-xs font-medium text-rose-700">
                          flagged
                        </span>
                      )}
                      {!u.disabled && !u.flagged && (
                        <span className="text-[color:var(--tb-slate-soft)]">—</span>
                      )}
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="text-sm font-medium text-[color:var(--tb-orange-deep)]"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminFilter>
      </div>
    </div>
  );
}
