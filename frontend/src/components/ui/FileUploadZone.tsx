import React, { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Upload, X, FileText } from "lucide-react";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  progress?: number;
  selectedFile?: File | null;
  onRemove?: () => void;
  className?: string;
}

function FileUploadZone({
  onFileSelect,
  accept = ".pdf,.doc,.docx,.txt",
  maxSizeMB = 10,
  progress,
  selectedFile,
  onRemove,
  className,
}: FileUploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback(
    (file: File) => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File exceeds ${maxSizeMB}MB limit`);
        return false;
      }
      setError(null);
      return true;
    },
    [maxSizeMB]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && validate(file)) onFileSelect(file);
    },
    [onFileSelect, validate]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && validate(file)) onFileSelect(file);
    },
    [onFileSelect, validate]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (typeof progress === "number" && progress >= 0) {
    return (
      <div className={cn("rounded-xl border border-border bg-surface p-6", className)}>
        <div className="flex items-center gap-3 mb-3">
          <FileText className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground truncate">{selectedFile?.name ?? "Uploading…"}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-surface-raised overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <p className="mt-2 text-xs text-text-secondary">{progress}%</p>
      </div>
    );
  }

  if (selectedFile) {
    return (
      <div className={cn("rounded-xl border border-border bg-surface p-4 flex items-center gap-3", className)}>
        <FileText className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
          <p className="text-xs text-text-secondary">{formatSize(selectedFile.size)}</p>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="shrink-0 rounded-lg p-1 hover:bg-surface-raised transition-colors"
            aria-label="Remove file"
          >
            <X className="h-4 w-4 text-text-secondary" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer",
        dragging ? "border-primary bg-primary-light" : "border-border hover:border-border-strong",
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" className="hidden" accept={accept} onChange={handleChange} />
      <Upload className="mx-auto h-8 w-8 text-text-tertiary mb-3" />
      <p className="text-sm font-medium text-foreground">
        Drop your file here or <span className="text-primary">browse</span>
      </p>
      <p className="mt-1 text-xs text-text-tertiary">
        {accept.replace(/\./g, "").toUpperCase().replace(/,/g, ", ")} • Max {maxSizeMB}MB
      </p>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export { FileUploadZone };
