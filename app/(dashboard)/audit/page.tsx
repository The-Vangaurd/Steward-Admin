"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { formatDistanceToNow, format } from "date-fns";
import { Filter, RefreshCw, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiSuccess, PaginationMeta } from "@/types";

interface AuditEntry {
  id: string;
  actorEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

interface FiltersState {
  action: string;
  resourceType: string;
  from: string;
  to: string;
  page: number;
}

const ACTION_COLORS: Record<string, string> = {
  ORDER_STATUS_CHANGED:   "text-info   bg-info/10   border-info/20",
  ORDER_CANCELLED:        "text-danger bg-danger/10 border-danger/20",
  ORDER_UNDO:             "text-warning bg-warning/10 border-warning/20",
  SETTINGS_UPDATED:       "text-accent bg-accent/10 border-accent/20",
  STAFF_CREATED:          "text-success bg-success/10 border-success/20",
  STAFF_DELETED:          "text-danger bg-danger/10 border-danger/20",
};

function AuditRow({ entry }: { entry: AuditEntry }) {
  const color = ACTION_COLORS[entry.action] ?? "text-fg-muted bg-surface-2 border-border";

  return (
    <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[auto_1fr_auto_auto] items-start gap-3 px-4 py-3 hover:bg-surface-2/50 transition-colors border-b border-border last:border-0">
      {/* Action badge */}
      <span className={cn(
        "hidden sm:inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap",
        color
      )}>
        {entry.action.replace(/_/g, " ")}
      </span>

      {/* Details */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            "sm:hidden inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
            color
          )}>
            {entry.action.replace(/_/g, " ")}
          </span>
          <span className="text-[12px] font-medium text-fg">
            {entry.resourceType}
            {entry.resourceId && (
              <span className="ml-1 font-mono text-fg-subtle text-[10px]">
                #{entry.resourceId.slice(-6)}
              </span>
            )}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-fg-subtle">
          <span>{entry.actorEmail ?? "System"}</span>
          {entry.ipAddress && (
            <>
              <span>·</span>
              <span className="font-mono">{entry.ipAddress}</span>
            </>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-right shrink-0">
        <p className="text-[11px] text-fg-muted">
          {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
        </p>
        <p className="text-[10px] text-fg-subtle mt-0.5">
          {format(new Date(entry.createdAt), "MMM d, HH:mm")}
        </p>
      </div>
    </div>
  );
}

export default function AuditPage() {
  const [filters, setFilters] = useState<FiltersState>({
    action: "",
    resourceType: "",
    from: "",
    to: "",
    page: 1,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["audit", filters],
    queryFn: async () => {
      const params: Record<string, string | number> = { page: filters.page, limit: 30 };
      if (filters.action)       params.action       = filters.action;
      if (filters.resourceType) params.resourceType = filters.resourceType;
      if (filters.from)         params.from         = filters.from;
      if (filters.to)           params.to           = filters.to;

      const { data } = await api.get<ApiSuccess<AuditEntry[]> & { meta: PaginationMeta }>(
        "/audit",
        { params }
      );
      return data;
    },
    staleTime: 30_000,
  });

  const { data: filterOpts } = useQuery({
    queryKey: ["audit-filters"],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<{ actions: string[]; resourceTypes: string[] }>>(
        "/audit/filters"
      );
      return data.data;
    },
    staleTime: 60_000,
  });

  const entries = (data as any)?.data ?? [];
  const meta    = (data as any)?.meta as PaginationMeta | undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface-2">
            <ShieldCheck className="h-4.5 w-4.5 text-fg-muted" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-fg">Audit Log</h1>
            <p className="text-[12px] text-fg-subtle">Immutable record of all admin actions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors",
              showFilters
                ? "border-accent/30 bg-accent/10 text-accent"
                : "border-border bg-surface text-fg-muted hover:text-fg hover:border-border-strong"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-[12px] font-medium text-fg-muted hover:text-fg hover:border-border-strong transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-surface p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="label-xs mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value, page: 1 }))}
              className="w-full h-8 rounded-md border border-border bg-surface-2 px-2 text-[12px] text-fg focus:border-accent focus:outline-none"
            >
              <option value="">All actions</option>
              {filterOpts?.actions.map((a) => (
                <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-xs mb-1">Resource</label>
            <select
              value={filters.resourceType}
              onChange={(e) => setFilters((f) => ({ ...f, resourceType: e.target.value, page: 1 }))}
              className="w-full h-8 rounded-md border border-border bg-surface-2 px-2 text-[12px] text-fg focus:border-accent focus:outline-none"
            >
              <option value="">All types</option>
              {filterOpts?.resourceTypes.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-xs mb-1">From</label>
            <input
              type="datetime-local"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value, page: 1 }))}
              className="w-full h-8 rounded-md border border-border bg-surface-2 px-2 text-[12px] text-fg focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="label-xs mb-1">To</label>
            <input
              type="datetime-local"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value, page: 1 }))}
              className="w-full h-8 rounded-md border border-border bg-surface-2 px-2 text-[12px] text-fg focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-5 w-36 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <ShieldCheck className="h-10 w-10 text-fg-subtle/30" />
            <p className="text-[13px] text-fg-muted">No audit entries found</p>
            <p className="text-[11px] text-fg-subtle">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((entry: AuditEntry) => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-fg-subtle">
            {meta.total} entries · Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={!meta.hasPrevPage}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-fg-muted hover:text-fg hover:border-border-strong transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={!meta.hasNextPage}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-fg-muted hover:text-fg hover:border-border-strong transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
