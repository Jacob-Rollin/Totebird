"use client";

import { useMemo, useState } from "react";
import { ProgressBar } from "@/components/progress-bar";
import { FileDropzone } from "@/components/file-dropzone";
import {
  readResponseJson,
  uploadStartErrorMessage,
} from "@/lib/read-response-json";

type Item = {
  id: string;
  label: string;
  done: boolean;
  itemType: "checkbox" | "text" | "file";
  required: boolean;
  answerText: string | null;
};

type FileRow = {
  id: string;
  filename: string;
  sizeBytes: number;
  checklistItemId?: string | null;
};

export function ChecklistClient({
  token,
  initialItems,
  initialFiles,
  readOnly,
}: {
  token: string;
  initialItems: Item[];
  initialFiles: FileRow[];
  readOnly: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [files, setFiles] = useState(initialFiles);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const progress = useMemo(() => {
    const total = items.length;
    const done = items.filter((i) => i.done).length;
    return {
      done,
      total,
      percent: total ? Math.round((done / total) * 100) : 0,
    };
  }, [items]);

  async function patchItem(
    itemId: string,
    body: { done?: boolean; answerText?: string },
  ) {
    setError(null);
    const res = await fetch(`/api/checklist/${token}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, ...body }),
    });
    if (!res.ok) {
      const { data } = await readResponseJson<{ error?: string }>(res);
      setError(
        typeof data.error === "string" && data.error
          ? data.error
          : "Could not save",
      );
      return false;
    }
    return true;
  }

  async function toggle(itemId: string, done: boolean) {
    if (readOnly) return;
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, done } : i)),
    );
    await patchItem(itemId, { done });
  }

  async function saveText(itemId: string, answerText: string) {
    if (readOnly) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, answerText, done: Boolean(answerText.trim()) }
          : i,
      ),
    );
    await patchItem(itemId, { answerText });
  }

  async function onUpload(file: File, checklistItemId?: string) {
    if (readOnly) return;
    setUploading(checklistItemId || "general");
    setMessage(null);
    setError(null);
    try {
      const contentType = file.type || "application/octet-stream";
      const res = await fetch(`/api/checklist/${token}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Spaces/parens are fine in JSON; server sanitizes the storage key.
          filename: file.name,
          contentType,
          sizeBytes: file.size,
          checklistItemId: checklistItemId || null,
        }),
      });
      const { data } = await readResponseJson<{
        error?: string;
        fileId?: string;
        uploadUrl?: string | null;
        message?: string | null;
      }>(res);

      if (!res.ok || !data.fileId) {
        throw new Error(uploadStartErrorMessage(res, data));
      }

      if (data.uploadUrl) {
        let put: Response;
        try {
          put = await fetch(data.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: file,
          });
        } catch {
          // Cross-origin B2 PUT without bucket CORS → TypeError
          // (Firefox: NetworkError…; Chrome: Failed to fetch).
          throw new Error(
            "Couldn’t reach storage. Check B2 CORS for your domain (allow s3_put from www.totebird.com / totebird.com).",
          );
        }
        if (!put.ok) {
          throw new Error(
            `Couldn’t finish upload to storage (HTTP ${put.status}). Check B2 CORS and that Content-Type matches the signed URL.`,
          );
        }
      }

      setFiles((prev) => [
        ...prev,
        {
          id: String(data.fileId),
          filename: file.name,
          sizeBytes: file.size,
          checklistItemId: checklistItemId || null,
        },
      ]);
      if (checklistItemId) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === checklistItemId ? { ...i, done: true } : i,
          ),
        );
      }
      setMessage(
        typeof data.message === "string" && data.message
          ? data.message
          : "Uploaded",
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload error";
      // Never surface raw JSON.parse / unexpected end of data to guests.
      if (/JSON\.parse|unexpected end of data|is not valid JSON/i.test(msg)) {
        setError("Couldn’t start upload.");
      } else {
        setError(msg);
      }
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="space-y-8">
      <ProgressBar
        percent={progress.percent}
        label={`${progress.done} of ${progress.total} complete`}
      />

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      )}

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-[color:var(--tb-line)] bg-white p-4"
          >
            {item.itemType === "checkbox" && (
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[color:var(--tb-orange)]"
                  checked={item.done}
                  disabled={readOnly}
                  onChange={(e) => toggle(item.id, e.target.checked)}
                />
                <span>
                  <span
                    className={
                      item.done
                        ? "text-[color:var(--tb-slate-soft)] line-through"
                        : ""
                    }
                  >
                    {item.label}
                  </span>
                  {!item.required && (
                    <span className="ml-2 text-xs text-[color:var(--tb-slate-soft)]">
                      optional
                    </span>
                  )}
                </span>
              </label>
            )}

            {item.itemType === "text" && (
              <div>
                <p className="font-medium">
                  {item.label}
                  {!item.required && (
                    <span className="ml-2 text-xs font-normal text-[color:var(--tb-slate-soft)]">
                      optional
                    </span>
                  )}
                </p>
                <textarea
                  className="tb-textarea mt-2 min-h-20"
                  defaultValue={item.answerText || ""}
                  disabled={readOnly}
                  placeholder="Your answer"
                  onBlur={(e) => saveText(item.id, e.target.value)}
                />
              </div>
            )}

            {item.itemType === "file" && (
              <div>
                <p className="font-medium" id={`file-label-${item.id}`}>
                  {item.label}
                  {item.done && (
                    <span className="ml-2 text-xs font-normal text-emerald-700">
                      uploaded
                    </span>
                  )}
                  {!item.required && (
                    <span className="ml-2 text-xs font-normal text-[color:var(--tb-slate-soft)]">
                      optional
                    </span>
                  )}
                </p>
                {!readOnly && (
                  <FileDropzone
                    inputId={`file-input-${item.id}`}
                    disabled={uploading === item.id}
                    label={
                      uploading === item.id
                        ? "Uploading…"
                        : "Click or drop file here"
                    }
                    onFile={(f) => void onUpload(f, item.id)}
                  />
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="tb-panel">
        <h2 className="font-semibold" id="extra-file-heading">
          Extra file drop
        </h2>
        <p className="mt-1 text-sm text-[color:var(--tb-slate-soft)]">
          Attach anything else the checklist didn’t ask for.
        </p>
        {!readOnly && (
          <FileDropzone
            inputId="extra-file-input"
            disabled={uploading === "general"}
            label={
              uploading === "general"
                ? "Uploading…"
                : "Click or drop file here"
            }
            onFile={(f) => void onUpload(f)}
          />
        )}
        {message && (
          <p className="mt-3 text-sm text-[color:var(--tb-slate-soft)]">{message}</p>
        )}
        {files.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {files.map((f) => (
              <li key={f.id} className="flex justify-between gap-2">
                <span>{f.filename}</span>
                <span className="text-[color:var(--tb-slate-soft)]">
                  {Math.round(f.sizeBytes / 1024)} KB
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
