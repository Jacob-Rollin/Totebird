import { formatBytes } from "@/lib/format";

export type ChecklistFileView = {
  id: string;
  filename: string;
  sizeBytes: number;
  downloadHref: string;
};

/** Compact name / size / Download rows for freelancer link detail. */
export function ChecklistFileList({
  files,
  emptyLabel = "No files yet",
}: {
  files: ChecklistFileView[];
  emptyLabel?: string;
}) {
  if (files.length === 0) {
    return (
      <p className="mt-1 text-xs text-[color:var(--tb-slate-soft)]">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className="mt-2 space-y-1.5">
      {files.map((f) => (
        <li
          key={f.id}
          className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm"
        >
          <span className="min-w-0 break-all text-[color:var(--tb-ink)]">
            {f.filename}
            <span className="ml-2 whitespace-nowrap text-xs text-[color:var(--tb-slate-soft)]">
              {formatBytes(f.sizeBytes)}
            </span>
          </span>
          <a
            href={f.downloadHref}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 font-medium text-[color:var(--tb-orange-deep)] underline-offset-2 hover:underline"
          >
            Download
          </a>
        </li>
      ))}
    </ul>
  );
}
