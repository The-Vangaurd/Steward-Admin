"use client";

import { useState, useMemo, Suspense, lazy } from "react";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import { IndianRupee, ShoppingBag, CheckCircle2, XCircle, Clock } from "lucide-react";
import { KpiCard } from "@/components/analytics/KpiCard";
import { RecentOrdersTable } from "@/components/analytics/RecentOrdersTable";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAnalyticsSummary, useRevenueData, useTopItems,
} from "@/hooks/useAnalytics";
import { useAuthStore } from "@/stores/auth.store";
import { useSettingsStore } from "@/stores/settings.store";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Lazy-load charts
const RevenueChart = lazy(() =>
  import("@/components/analytics/RevenueChart").then((m) => ({ default: m.RevenueChart }))
);
const TopItemsChart = lazy(() =>
  import("@/components/analytics/TopItemsChart").then((m) => ({ default: m.TopItemsChart }))
);

type QuickRange = "today" | "yesterday" | "7d" | "30d";
const ISO = (d: Date) => d.toISOString();

function getRange(range: QuickRange): { from: string; to: string } {
  const now = new Date();
  switch (range) {
    case "today":
      return { from: ISO(startOfDay(now)), to: ISO(endOfDay(now)) };
    case "yesterday": {
      const y = subDays(now, 1);
      return { from: ISO(startOfDay(y)), to: ISO(endOfDay(y)) };
    }
    case "7d":
      return { from: ISO(startOfDay(subDays(now, 6))), to: ISO(endOfDay(now)) };
    case "30d":
    default:
      return { from: ISO(startOfDay(subDays(now, 29))), to: ISO(endOfDay(now)) };
  }
}

const QUICK_RANGES: { label: string; value: QuickRange }[] = [
  { label: "Today",     value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "7D",        value: "7d" },
  { label: "30D",       value: "30d" },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const ChartSkeleton = () => <Skeleton className="h-56 w-full rounded-xl bg-surface-2" />;

export default function DashboardPage() {
  const user       = useAuthStore((s) => s.user);
  const restaurant = useAuthStore((s) => s.restaurant);
  const { wsConnected } = useSettingsStore();

  const [activeRange, setActiveRange] = useState<QuickRange>("30d");
  const params  = useMemo(() => getRange(activeRange), [activeRange]);
  const summary  = useAnalyticsSummary(params);
  const revenue  = useRevenueData(params);
  const topItems = useTopItems(params);

  const loading = summary.isLoading;
  const d = summary.data;
  const cancelRate = d ? d.cancellationRate.toFixed(1) : null;

  function RangeToggle() {
    return (
      <div className="inline-flex items-center rounded-lg border border-border bg-surface p-0.5">
        {QUICK_RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setActiveRange(r.value)}
            className={cn(
              "h-7 px-3 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all duration-150",
              activeRange === r.value
                ? "bg-surface-3 text-fg border border-border-strong shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                : "text-fg-muted hover:text-fg"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-1 border-b border-border">
        <div>
          <div className="label-xs mb-1.5">{restaurant?.name ?? "Restaurant"}</div>
          <h2 className="text-xl font-semibold tracking-tight text-fg">
            {getGreeting()}, {user?.firstName ?? "there"}.
          </h2>
          <p className="text-[12px] text-fg-subtle mt-1 num">
            {format(new Date(params.from), "dd MMM")} — {format(new Date(params.to), "dd MMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "hidden sm:flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-[11px] font-medium",
            wsConnected
              ? "border-success/30 bg-success/10 text-success"
              : "border-border bg-surface text-fg-subtle"
          )}>
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              wsConnected ? "bg-success live-dot" : "bg-fg-subtle"
            )} />
            {wsConnected ? "Live" : "Offline"}
          </div>
          <RangeToggle />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard title="Revenue" value={d ? formatCurrency(d.totalRevenue) : "—"} icon={IndianRupee} loading={loading} accent="accent" description={activeRange === "today" ? "today so far" : undefined} />
        <KpiCard title="Orders" value={d ? String(d.totalOrders) : "—"} icon={ShoppingBag} loading={loading} accent="info" />
        <KpiCard title="Completed" value={d ? String(d.completedOrders) : "—"} icon={CheckCircle2} loading={loading} accent="success" description={d && d.totalOrders > 0 ? `${((d.completedOrders / d.totalOrders) * 100).toFixed(0)}% completion` : undefined} />
        <KpiCard title="Cancel Rate" value={cancelRate ? `${cancelRate}%` : "—"} icon={XCircle} loading={loading} accent="danger" />
        <KpiCard title="Avg Prep Time" value={d ? `${d.avgPrepTimeMins.toFixed(0)}m` : "—"} icon={Clock} loading={loading} accent="warning" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart data={revenue.data} loading={revenue.isLoading} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <TopItemsChart data={topItems.data} loading={topItems.isLoading} />
        </Suspense>
      </div>

      {/* ── Order List ───────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-fg">Order List</h3>
          {/* Range toggle — same state as the header-level one */}
          <div className="inline-flex items-center rounded-lg border border-border bg-surface p-0.5">
            {QUICK_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setActiveRange(r.value)}
                className={cn(
                  "h-7 px-3 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all duration-150",
                  activeRange === r.value
                    ? "bg-surface-3 text-fg border border-border-strong shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    : "text-fg-muted hover:text-fg"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <RecentOrdersTable params={params} activeRange={activeRange} />
      </div>
    </div>
  );
}
