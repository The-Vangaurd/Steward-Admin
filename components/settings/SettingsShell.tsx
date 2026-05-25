"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SettingsShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function SettingsShell({ title, description, children, actions }: SettingsShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-semibold text-fg tracking-tight">{title}</h3>
          {description && (
            <p className="text-[12px] text-fg-subtle mt-0.5">{description}</p>
          )}
        </div>
        {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

interface SettingsRowProps {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsRow({ label, description, children, className }: SettingsRowProps) {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row sm:items-start gap-3 py-4 border-b border-border last:border-0",
      className
    )}>
      <div className="sm:w-56 shrink-0">
        <div className="text-[13px] font-medium text-fg">{label}</div>
        {description && (
          <div className="text-[11px] text-fg-subtle mt-0.5 leading-relaxed">{description}</div>
        )}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

export function SettingsSection({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface px-5 py-1", className)}>
      {children}
    </div>
  );
}
