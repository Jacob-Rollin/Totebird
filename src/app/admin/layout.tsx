import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { requireAdmin } from "@/lib/admin";
import { requireSession } from "@/lib/auth";

/** Auth + Neon — never statically prerender (Netlify build / headers). */
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  if (!requireAdmin(session)) {
    redirect("/app");
  }

  return (
    <div className="min-h-screen bg-[color:var(--tb-mist)]">
      <AppNav user={session} section="admin" />
      <main className="tb-shell py-8">{children}</main>
    </div>
  );
}
