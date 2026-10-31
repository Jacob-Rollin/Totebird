import { PublicSiteHeader } from "@/components/public-site-header";
import { StatusPill } from "@/components/status-pill";
import { listChangelogEntries } from "@/lib/data";
import { hasClerkPublishable } from "@/lib/env-public";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Changelog",
  description: "What’s new in Totebird — features, fixes, and improvements.",
};

export default async function ChangelogPage() {
  let entries: Awaited<ReturnType<typeof listChangelogEntries>> = [];
  try {
    entries = await listChangelogEntries();
  } catch (err) {
    console.error("[totebird] changelog list soft-fail", err);
  }

  const clerkEnabled = hasClerkPublishable();

  return (
    <div className="min-h-screen bg-[color:var(--tb-mist)]">
      <PublicSiteHeader clerkEnabled={clerkEnabled} guest="changelog" />

      <main className="tb-shell max-w-2xl py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-[color:var(--tb-orange-deep)]">
          Totebird
        </p>
        <h1 className="font-display mt-2 text-4xl text-[color:var(--tb-ink)]">
          Changelog
        </h1>
        <p className="mt-2 text-[color:var(--tb-slate-soft)]">
          New features, bug fixes, and improvements — newest first.
        </p>

        <ol className="mt-10 space-y-8">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="border-t border-[color:var(--tb-line)] pt-8 first:border-t-0 first:pt-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={entry.kind} />
                <time
                  dateTime={
                    entry.publishedAt instanceof Date
                      ? entry.publishedAt.toISOString()
                      : String(entry.publishedAt)
                  }
                  className="text-sm text-[color:var(--tb-slate-soft)]"
                >
                  {formatDate(entry.publishedAt)}
                </time>
              </div>
              <h2 className="font-display mt-2 text-2xl text-[color:var(--tb-ink)]">
                {entry.title}
              </h2>
              {entry.body && (
                <p className="mt-2 whitespace-pre-wrap text-[color:var(--tb-slate)] leading-relaxed">
                  {entry.body}
                </p>
              )}
            </li>
          ))}
        </ol>

        {entries.length === 0 && (
          <p className="mt-10 rounded-lg border border-[color:var(--tb-line)] bg-white px-4 py-6 text-sm text-[color:var(--tb-slate-soft)]">
            No public updates yet. When feedback is marked done and published
            from admin, it shows up here.
          </p>
        )}
      </main>
    </div>
  );
}
