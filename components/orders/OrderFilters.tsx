"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Filter, X } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OrderFilters as OrderFiltersType } from "@/types";

// History page shows all terminal + active statuses
const STATUS_OPTIONS = ["NEW", "PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELLED"] as const;
const TYPE_OPTIONS = ["DINE_IN", "TAKEAWAY", "DELIVERY"];

interface Props { filters: OrderFiltersType; onChange: (f: OrderFiltersType) => void; }

export function OrderFilters({ filters, onChange }: Props) {
  const set = (patch: Partial<OrderFiltersType>) =>
    onChange({ ...filters, page: 1, ...patch });

  const active = !!(filters.status || filters.orderType || filters.from || filters.to);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-fg-muted">
        <Filter className="h-3.5 w-3.5" />
        <span className="text-[11px] font-semibold uppercase tracking-wider">Filter</span>
      </div>

      <Select value={filters.status ?? "ALL"} onValueChange={(v) => set({ status: v === "ALL" ? undefined : v as any })}>
        <SelectTrigger className="h-8 w-[140px] bg-surface-2 border-border text-[12px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>{s.toLowerCase()}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.orderType ?? "ALL"} onValueChange={(v) => set({ orderType: v === "ALL" ? undefined : v as any })}>
        <SelectTrigger className="h-8 w-[140px] bg-surface-2 border-border text-[12px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All types</SelectItem>
          {TYPE_OPTIONS.map((t) => (
            <SelectItem key={t} value={t}>{t.replace("_", " ").toLowerCase()}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          className="h-8 w-[140px] bg-surface-2 border-border text-[12px]"
          value={filters.from ? format(new Date(filters.from), "yyyy-MM-dd") : ""}
          onChange={(e) => set({ from: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
        />
        <span className="text-[11px] text-fg-subtle">→</span>
        <Input
          type="date"
          className="h-8 w-[140px] bg-surface-2 border-border text-[12px]"
          value={filters.to ? format(new Date(filters.to), "yyyy-MM-dd") : ""}
          onChange={(e) => set({ to: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
        />
      </div>

      {active && (
        <Button size="sm" variant="ghost" className="gap-1 text-fg-muted h-8"
          onClick={() => onChange({ page: 1, limit: filters.limit ?? 25 })}>
          <X className="h-3 w-3" /> Clear
        </Button>
      )}
    </div>
  );
}
