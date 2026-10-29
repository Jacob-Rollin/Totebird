import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { requireSession } from "@/lib/auth";

/** Auth + Neon — never statically prerender (Netlify build / headers). */
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  if (!session) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-[color:var(--tb-mist)]">
      <AppNav user={session} section="app" />
      <main className="tb-shell py-8">{children}</main>
    </div>
  );
}
