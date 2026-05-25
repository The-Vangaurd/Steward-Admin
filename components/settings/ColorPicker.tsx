"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const PRESETS = [
  "#8B5CF6", "#6366F1", "#3B82F6", "#0EA5E9",
  "#10B981", "#F59E0B", "#EF4444", "#EC4899",
  "#F97316", "#14B8A6", "#8B5A2B", "#1E293B",
];

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className={cn(
          "flex items-center gap-2 h-8 px-2.5 rounded-md border border-border bg-surface-2 text-[12px] text-fg-muted hover:border-border-strong transition-colors"
        )}
        onClick={() => setOpen(!open)}
      >
        <span className="h-4 w-4 rounded-sm border border-border-strong" style={{ background: value }} />
        <span className="font-mono">{value}</span>
      </button>
      {open && (
        <div className="absolute left-0 top-10 z-50 rounded-xl border border-border bg-surface p-3 shadow-elevated space-y-3 w-56">
          <div className="grid grid-cols-6 gap-1.5">
            {PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                className={cn(
                  "h-6 w-6 rounded-md border-2 transition-transform hover:scale-110",
                  value === c ? "border-fg" : "border-transparent"
                )}
                style={{ background: c }}
                onClick={() => { onChange(c); setOpen(false); }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value); }}
              className="flex-1 h-7 rounded-md border border-border bg-surface-2 px-2 text-[12px] font-mono text-fg focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full rounded-md bg-surface-3 py-1.5 text-[12px] font-medium text-fg-muted hover:text-fg transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
