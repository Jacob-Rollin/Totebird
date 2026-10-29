"use client";

import { useState } from "react";

type Item = {
  id: string;
  label: string;
  done: boolean;
};

type FileRow = {
  id: string;
  filename: string;
  sizeBytes: number;
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
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function toggle(itemId: string, done: boolean) {
    if (readOnly) return;
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, done } : i)),
    );
    await fetch(`/api/checklist/${token}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, done }),
    });
  }

  async function onUpload(file: File) {
    if (readOnly) return;
    setUploading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/checklist/${token}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      if (data.uploadUrl) {
        const put = await fetch(data.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!put.ok) throw new Error("R2 upload failed");
      }

      setFiles((prev) => [
        ...prev,
        {
          id: data.fileId,
          filename: file.name,
          sizeBytes: file.size,
        },
      ]);
      setMessage(data.message || "Uploaded");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[color:var(--tb-line)] bg-white p-4">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[color:var(--tb-orange)]"
                checked={item.done}
                disabled={readOnly}
                onChange={(e) => toggle(item.id, e.target.checked)}
              />
              <span className={item.done ? "text-[color:var(--tb-slate-soft)] line-through" : ""}>
                {item.label}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="tb-panel">
        <h2 className="font-semibold">File drop</h2>
        <p className="mt-1 text-sm text-[color:var(--tb-slate-soft)]">
          Attach logos, docs, or assets (max ~10 MB each).
        </p>
        {!readOnly && (
          <input
            type="file"
            className="mt-4 block w-full text-sm"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUpload(f);
            }}
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
