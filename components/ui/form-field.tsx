"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, error, hint, required, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-[12px] font-medium text-fg">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-danger">{error}</p>
      )}
      {hint && !error && (
        <p className="text-[11px] text-fg-subtle">{hint}</p>
      )}
    </div>
  );
}
