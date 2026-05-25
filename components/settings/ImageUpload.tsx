"use client";

import { useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadAsset } from "@/hooks/useRestaurantSettings";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  type: "logo" | "banner";
  label: string;
  aspectRatio?: string;
  maxSizeMb?: number;
}

export function ImageUpload({
  value,
  onChange,
  type,
  label,
  aspectRatio = type === "logo" ? "aspect-square" : "aspect-[3/1]",
  maxSizeMb = 2,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { mutateAsync: upload, isPending } = useUploadAsset();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > maxSizeMb * 1024 * 1024) {
      alert(`File must be under ${maxSizeMb}MB`);
      return;
    }
    const url = await upload({ file, type });
    if (url) onChange(url);
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative group rounded-lg border-2 border-dashed border-border bg-surface-2 overflow-hidden cursor-pointer transition-colors",
          aspectRatio,
          dragOver && "border-accent bg-accent/5",
          isPending && "pointer-events-none opacity-60"
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={label} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity">
              <span className="text-[12px] font-medium text-white flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" /> Change
              </span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-fg-subtle">
            {isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-fg-subtle border-t-fg" />
            ) : (
              <>
                <ImageIcon className="h-6 w-6" />
                <span className="text-[11px]">Click or drag to upload</span>
                <span className="text-[10px] text-fg-subtle">PNG, JPG, WebP · max {maxSizeMb}MB</span>
              </>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="flex items-center gap-1 text-[11px] text-danger hover:text-danger/80 transition-colors"
        >
          <X className="h-3 w-3" /> Remove {label}
        </button>
      )}
    </div>
  );
}
