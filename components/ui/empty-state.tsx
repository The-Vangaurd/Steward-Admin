"use client";

import { type ReactNode, type ElementType } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 px-6 text-center", className)}>
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-2">
          <Icon className="h-5 w-5 text-fg-subtle" />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-[14px] font-semibold text-fg">{title}</p>
        {description && <p className="text-[12px] text-fg-subtle max-w-xs">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
