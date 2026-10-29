import Link from "next/link";
import { TotebirdLogo } from "@/components/logo";
import type { SessionUser } from "@/lib/auth";

export function AppNav({
  user,
  section = "app",
}: {
  user: SessionUser;
  section?: "app" | "admin";
}) {
  return (
    <header className="border-b border-[color:var(--tb-line)] bg-white">
      <div className="tb-shell flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
          <TotebirdLogo
            size="sm"
            variant="header"
            href={section === "admin" ? "/admin" : "/app"}
          />
          <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-[color:var(--tb-slate-soft)] sm:gap-4">
            {section === "app" ? (
              <>
                <Link href="/app" className="hover:text-[color:var(--tb-ink)]">
                  Links
                </Link>
                <Link
                  href="/app/links/new"
                  className="hover:text-[color:var(--tb-ink)]"
                >
                  New
                </Link>
                <Link
                  href="/app/billing"
                  className="hover:text-[color:var(--tb-ink)]"
                >
                  Billing
                </Link>
              </>
            ) : (
              <>
                <Link href="/admin" className="hover:text-[color:var(--tb-ink)]">
                  Overview
                </Link>
                <Link
                  href="/admin/users"
                  className="hover:text-[color:var(--tb-ink)]"
                >
                  Users
                </Link>
                <Link
                  href="/admin/links"
                  className="hover:text-[color:var(--tb-ink)]"
                >
                  Links
                </Link>
                <Link
                  href="/admin/invoices"
                  className="hover:text-[color:var(--tb-ink)]"
                >
                  Invoices
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user.isAdmin && section === "app" && (
            <Link
              href="/admin"
              className="font-medium text-[color:var(--tb-orange-deep)]"
            >
              Admin
            </Link>
          )}
          {section === "admin" && (
            <Link
              href="/app"
              className="font-medium text-[color:var(--tb-slate-soft)]"
            >
              Dashboard
            </Link>
          )}
          <span className="hidden truncate text-[color:var(--tb-slate-soft)] sm:inline max-w-[180px]">
            {user.email}
          </span>
        </div>
      </div>
    </header>
  );
}
