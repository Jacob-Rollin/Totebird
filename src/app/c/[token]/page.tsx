import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChecklistClient } from "@/components/checklist-client";
import { getChecklistBundle } from "@/lib/data";

export default async function ClientChecklistPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const bundle = await getChecklistBundle(token);
  if (!bundle) notFound();

  const { link, items, files, owner } = bundle;
  const closed = link.status === "closed" || link.status === "disabled";

  return (
    <div className="min-h-screen bg-[color:var(--tb-mist)]">
      <header className="border-b border-[color:var(--tb-line)] bg-white">
        <div className="tb-shell flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/icon/icon-orange-bird.png"
              alt=""
              width={36}
              height={36}
            />
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--tb-slate-soft)]">
                Checklist from {owner?.name || owner?.email || "your freelancer"}
              </p>
              <h1 className="text-lg font-semibold">{link.title}</h1>
            </div>
          </div>
          <Link href="/" className="hidden sm:block">
            <Image
              src="/brand/wordmark-slate-orange.png"
              alt="Totebird"
              width={140}
              height={35}
              className="h-7 w-auto"
            />
          </Link>
        </div>
      </header>

      <main className="tb-shell max-w-2xl py-10">
        {closed ? (
          <div className="tb-panel text-[color:var(--tb-slate-soft)]">
            This link is no longer accepting updates.
          </div>
        ) : (
          <>
            <p className="mb-6 text-[color:var(--tb-slate-soft)]">
              No account needed — check items off and drop files below.
            </p>
            <ChecklistClient
              token={token}
              initialItems={items.map((i) => ({
                id: i.id,
                label: i.label,
                done: i.done,
              }))}
              initialFiles={files.map((f) => ({
                id: f.id,
                filename: f.filename,
                sizeBytes: f.sizeBytes,
              }))}
              readOnly={closed}
            />
          </>
        )}
        <p className="mt-10 text-center text-xs text-[color:var(--tb-slate-soft)]">
          Powered by Totebird
        </p>
      </main>
    </div>
  );
}
