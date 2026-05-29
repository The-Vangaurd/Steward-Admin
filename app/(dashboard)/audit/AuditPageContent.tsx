"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import { formatDistanceToNow, format, subHours } from "date-fns";
import { Filter, RefreshCw, ClipboardList, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { ApiSuccess, PaginationMeta } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: string;
  actorId: string | null;
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
  actorId: string;
  from: string;
  to: string;
  page: number;
}

// ─── Action badge config ──────────────────────────────────────────────────────

type BadgeVariant = "default" | "neutral" | "warning" | "info" | "success" | "danger" | "accent";

const ACTION_BADGE: Record<string, { variant: BadgeVariant; label: string }> = {
  ORDER_STATUS_CHANGED: { variant: "info",    label: "Status changed" },
  ORDER_CANCELLED:      { variant: "danger",  label: "Order cancelled" },
  ORDER_UNDO:           { variant: "warning", label: "Order undo" },
  SETTINGS_UPDATED:     { variant: "accent",  label: "Settings updated" },
  STAFF_CREATED:        { variant: "success", label: "Staff created" },
  STAFF_DELETED:        { variant: "danger",  label: "Staff removed" },
  STAFF_UPDATED:        { variant: "info",    label: "Staff updated" },
  MENU_ITEM_UPDATED:    { variant: "warning", label: "Menu updated" },
  MENU_ITEM_CREATED:    { variant: "success", label: "Menu item added" },
  MENU_ITEM_DELETED:    { variant: "danger",  label: "Menu item removed" },
};

// ─── Initials avatar ──────────────────────────────────────────────────────────

function ActorAvatar({ email }: { email: string | null }) {
  if (!email) return (
    <div className="h-7 w-7 flex-shrink-0 rounded-full bg-surface-3 border border-border grid place-items-center">
      <User className="h-3.5 w-3.5 text-fg-subtle" />
    </div>
  );
  const initials = email.split("@")[0].slice(0, 2).toUpperCase();
  return (
    <div className="h-7 w-7 flex-shrink-0 rounded-full bg-accent/15 border border-accent/25 grid place-items-center">
      <span className="text-[10px] font-bold text-accent">{initials}</span>
    </div>
  );
}

// ─── Single log row ───────────────────────────────────────────────────────────

function AuditRow({ entry }: { entry: AuditEntry }) {
  const cfg = ACTION_BADGE[entry.action] ?? { variant: "neutral" as BadgeVariant, label: entry.action.replace(/_/g, " ") };
  const actorName = entry.actorEmail
    ? entry.actorEmail.split("@")[0]
    : "System";

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-surface-2/50 transition-colors border-b border-border last:border-0">
      {/* Avatar */}
      <ActorAvatar email={entry.actorEmail} />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] font-semibold text-fg">{actorName}</span>
          <Badge variant={cfg.variant} className="text-[9px]">{cfg.label}</Badge>
          <span className="text-[11px] text-fg-subtle">
            {entry.resourceType}
            {entry.resourceId && (
              <span className="ml-1 font-mono text-fg-subtle/60">#{entry.resourceId.slice(-6)}</span>
            )}
          </span>
        </div>
        <div className="mt-0.5 text-[11px] text-fg-subtle">
          {entry.actorEmail ?? "system"}
          {entry.ipAddress && (
            <span className="ml-2 font-mono opacity-60">{entry.ipAddress}</span>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-right flex-shrink-0 pt-0.5">
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

// ─── Default "from" = 24 hours ago ───────────────────────────────────────────
function defaultFrom() {
  return format(subHours(new Date(), 24), "yyyy-MM-dd'T'HH:mm");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuditPageContent() {
  const searchParams = useSearchParams();
  const presetActorId = searchParams.get("actorId") ?? "";
  const presetActorEmail = searchParams.get("actorEmail") ?? "";

  const [filters, setFilters] = useState<FiltersState>({
    action: "",
    resourceType: "",
    actorId: presetActorId,
    from: defaultFrom(),
    to: "",
    page: 1,
  });
  const [showFilters, setShowFilters] = useState(false);

  // If a staff member is pre-selected via URL, open filters panel automatically
  useEffect(() => {
    if (presetActorId) setShowFilters(true);
  }, [presetActorId]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["audit", filters],
    queryFn: async () => {
      const params: Record<string, string | number> = { page: filters.page, limit: 30 };
      if (filters.action)       params.action       = filters.action;
      if (filters.resourceType) params.resourceType = filters.resourceType;
      if (filters.actorId)      params.actorId      = filters.actorId;
      if (filters.from)         params.from         = new Date(filters.from).toISOString();
      if (filters.to)           params.to           = new Date(filters.to).toISOString();

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

  const hasActiveFilters =
    !!filters.action || !!filters.resourceType || !!filters.actorId || !!filters.to;

  const clearFilters = () =>
    setFilters({ action: "", resourceType: "", actorId: "", from: defaultFrom(), to: "", page: 1 });

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-5 max-w-[1200px] mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3 pb-1">
        <div>
          <div className="label-xs mb-1">Administration</div>
          <h2 className="text-xl font-semibold tracking-tight text-fg">Staff Logs</h2>
          <p className="text-[12px] text-fg-subtle mt-1">
            {presetActorEmail
              ? `Showing activity for ${presetActorEmail}`
              : "Immutable record of all staff actions"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-[12px] font-medium text-fg-muted hover:text-fg transition-colors"
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
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

      {/* ── Pre-selected staff banner ── */}
      {presetActorEmail && (
        <div className="flex items-center gap-2.5 rounded-xl border border-accent/25 bg-accent/8 px-4 py-3">
          <div className="h-7 w-7 rounded-full bg-accent/20 grid place-items-center flex-shrink-0">
            <User className="h-3.5 w-3.5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-fg">{presetActorEmail.split("@")[0]}</p>
            <p className="text-[11px] text-fg-subtle">{presetActorEmail}</p>
          </div>
          <a
            href="/audit"
            className="text-[11px] text-fg-muted hover:text-fg transition-colors whitespace-nowrap"
          >
            View all staff →
          </a>
        </div>
      )}

      {/* ── Filters panel ── */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-surface p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="label-xs mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value, page: 1 }))}
              className="w-full h-8 rounded-md border border-border bg-surface-2 px-2 text-[12px] text-fg focus:border-accent focus:outline-none"
            >
              <option value="">All actions</option>
              {filterOpts?.actions.map((a) => (
                <option key={a} value={a}>{a.replace(/_/g, " ").toLowerCase()}</option>
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
            <label className="label-xs mb-1">Staff email</label>
            <input
              type="text"
              placeholder="filter by email…"
              value={filters.actorId}
              onChange={(e) => setFilters((f) => ({ ...f, actorId: e.target.value, page: 1 }))}
              className="w-full h-8 rounded-md border border-border bg-surface-2 px-2 text-[12px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
            />
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

      {/* ── Table ── */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2 bg-surface-2 border-b border-border">
          <div className="w-7" />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Staff / Action</span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle text-right">Time</span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
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
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 border border-border">
              <ClipboardList className="h-5 w-5 text-fg-subtle" />
            </div>
            <p className="text-[13px] font-medium text-fg">No activity found</p>
            <p className="text-[11px] text-fg-subtle">Try adjusting the time range or filters</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((entry: AuditEntry) => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-fg-subtle num">
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
