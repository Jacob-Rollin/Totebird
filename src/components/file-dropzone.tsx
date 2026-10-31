"use client";

import { useId, useRef, useState } from "react";

const MAX_HINT = "Max ~10 MB per file";

export function FileDropzone({
  disabled,
  onFile,
  label = "Click or drop file here",
  inputId,
}: {
  disabled?: boolean;
  onFile: (file: File) => void;
  label?: string;
  inputId?: string;
}) {
  const autoId = useId();
  const id = inputId || autoId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function takeFile(file: File | undefined | null) {
    if (!file || disabled) return;
    onFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div
      className={`mt-3 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${
        dragging
          ? "border-[color:var(--tb-orange)] bg-[color:var(--tb-orange-soft)]"
          : "border-[color:var(--tb-line)] bg-[color:var(--tb-mist)]"
      } ${disabled ? "opacity-60" : ""}`}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
        takeFile(e.dataTransfer.files?.[0]);
      }}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => takeFile(e.target.files?.[0])}
      />
      <p className="text-sm font-medium text-[color:var(--tb-ink)]">{label}</p>
      <p className="mt-1 text-xs text-[color:var(--tb-slate-soft)]">{MAX_HINT}</p>
      <label
        htmlFor={id}
        className={`tb-btn tb-btn-secondary mt-3 inline-flex cursor-pointer px-4 py-2 text-sm ${
          disabled ? "pointer-events-none" : ""
        }`}
      >
        Browse files
      </label>
    </div>
  );
}
