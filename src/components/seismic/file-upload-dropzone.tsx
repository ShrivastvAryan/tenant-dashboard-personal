"use client";

import React, { useRef } from "react";
import { Loader2, Trash2, Plus, Check } from "lucide-react";

interface FileUploadDropzoneProps {
  file: File | null;
  onFileSelect: (f: File | null) => void;
  onUpload?: (f: File) => void;
  onRemove?: () => void;
  isUploading?: boolean;
  isUploaded?: boolean;
  onError?: (msg: string) => void;
  label?: string;
  sublabel?: string;
}

export function FileUploadDropzone({
  file,
  onFileSelect,
  onUpload,
  onRemove,
  isUploading = false,
  isUploaded = false,
  onError,
  label = "Drag and drop a file here",
  sublabel = "...or click to choose. Up to 5 MB. Accepted: PDF, JPEG, or PNG.",
}: FileUploadDropzoneProps) {
  const MIN_SIZE_BYTES = 10 * 1024; // 10 KB
  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected) {
      if (selected.size < MIN_SIZE_BYTES) {
        if (onError) {
          onError(`File size must be at least 10 KB. (Selected file is ${(selected.size / 1024).toFixed(1)} KB)`);
        }
        e.target.value = "";
        return;
      }
      if (selected.size > MAX_SIZE_BYTES) {
        if (onError) {
          onError(`File size must not exceed 5 MB. (Selected file is ${(selected.size / 1024 / 1024).toFixed(2)} MB)`);
        }
        e.target.value = "";
        return;
      }
      onFileSelect(selected);
      if (onUpload) {
        onUpload(selected);
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onFileSelect(null);
    if (onRemove) {
      onRemove();
    }
  };

  const hasItem = Boolean(file || isUploaded);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-dashed border-[var(--color-stroke)] bg-[#f8fafc]">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        onChange={handleFileChange}
        disabled={isUploading}
        className="hidden"
      />

      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-semibold text-[#0f172a] truncate">
          {file ? file.name : isUploaded ? "Document uploaded" : label}
        </span>
        <span className="text-xs text-[#64748b]">
          {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : isUploaded ? "Ready / Saved" : sublabel}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isUploading ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--color-brand)] text-white">
            <Loader2 size={13} className="animate-spin" /> Uploading...
          </span>
        ) : hasItem ? (
          <button
            type="button"
            onClick={handleRemove}
            title="Remove image"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all cursor-pointer shadow-2xs"
          >
            <Trash2 size={13} />
            Remove
          </button>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            title="Click plus icon to select file"
            className="h-9.5 w-9.5 rounded-full bg-white hover:bg-[var(--color-brand)] text-[var(--color-brand)] hover:text-white flex items-center justify-center border border-[var(--color-stroke)] hover:border-[var(--color-brand)] transition-all shadow-2xs shrink-0 cursor-pointer"
          >
            <Plus size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
