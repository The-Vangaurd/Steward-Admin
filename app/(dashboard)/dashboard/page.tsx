"use client";

import { useState, useMemo, Suspense, lazy } from "react";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import {
  IndianRupee, ShoppingBag, CheckCircle2, XCircle, Clock,
} from "lucide-react";
import { KpiCard } from "@/components/analytics/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAnalyticsSummary, useRevenueData, useTopItems, useHourlyData,
} from "@/hooks/useAnalytics";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Lazy-load charts — they pull in recharts which is ~150KB
const RevenueChart = lazy(() =>
  import("@/components/analytics/RevenueChart").then((m) => ({ default: m.RevenueChart }))
);
const TopItemsChart = lazy(() =>
  import("@/components/analytics/TopItemsChart").then((m) => ({ default: m.TopItemsChart }))
);
const HourlyChart = lazy(() =>
  import("@/components/analytics/HourlyChart").then((m) => ({ default: m.HourlyChart }))
);

type QuickRange = "today" | "yesterday" | "7d" | "30d";
const ISO = (d: Date) => d.toISOString();
function getRange(range: QuickRange): { from: string; to: string } {
  const now = new Date();
  switch (range) {
    case "today":     return { from: ISO(startOfDay(now)), to: ISO(endOfDay(now)) };
    case "yesterday":{ const y = subDays(now, 1); return { from: ISO(startOfDay(y)), to: ISO(endOfDay(y)) }; }
    case "7d":        return { from: ISO(startOfDay(subDays(now, 6))), to: ISO(endOfDay(now)) };
    case "30d":
    default:          return { from: ISO(startOfDay(subDays(now, 29))), to: ISO(endOfDay(now)) };
  }
}
const QUICK_RANGES: { label: string; value: QuickRange }[] = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
];

const ChartSkeleton = () => <Skeleton className="h-56 w-full rounded-xl" />;

export default function DashboardPage() {
  const [activeRange, setActiveRange] = useState<QuickRange>("30d");
  const params = useMemo(() => getRange(activeRange), [activeRange]);
  const summary = useAnalyticsSummary(params);
  const revenue = useRevenueData(params);
  const topItems = useTopItems(params);
  const hourly = useHourlyData(params);
  const loading = summary.isLoading;

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 pb-1">
        <div>
          <div className="label-xs mb-1">Performance</div>
          <h2 className="text-xl font-semibold tracking-tight text-fg">Overview</h2>
          <p className="text-[12px] text-fg-subtle mt-1 num">
            {format(new Date(params.from), "dd MMM")} — {format(new Date(params.to), "dd MMM yyyy")}
          </p>
        </div>
        <div className="inline-flex items-center rounded-lg border border-border bg-surface p-0.5">
          {QUICK_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setActiveRange(r.value)}
              className={cn(
                "h-7 px-2.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-colors",
                activeRange === r.value
                  ? "bg-surface-3 text-fg border border-border-strong"
                  : "text-fg-muted hover:text-fg"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs — server-side friendly, no chart lib needed */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard title="Revenue" value={summary.data ? formatCurrency(summary.data.totalRevenue) : "—"} icon={IndianRupee} loading={loading} accent="accent" />
        <KpiCard title="Orders" value={summary.data ? String(summary.data.totalOrders) : "—"} icon={ShoppingBag} loading={loading} accent="info" />
        <KpiCard title="Completed" value={summary.data ? String(summary.data.completedOrders) : "—"} icon={CheckCircle2} loading={loading} accent="success" />
        <KpiCard title="Cancel Rate" value={summary.data ? `${summary.data.cancellationRate.toFixed(1)}%` : "—"} icon={XCircle} loading={loading} accent="danger" />
        <KpiCard title="Avg Prep" value={summary.data ? `${summary.data.avgPrepTimeMins.toFixed(0)}m` : "—"} icon={Clock} loading={loading} accent="warning" />
      </div>

      {/* Charts — lazy loaded, each with its own Suspense boundary */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart data={revenue.data} loading={revenue.isLoading} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <TopItemsChart data={topItems.data} loading={topItems.isLoading} />
        </Suspense>
      </div>
      <Suspense fallback={<ChartSkeleton />}>
        <HourlyChart data={hourly.data} loading={hourly.isLoading} />
      </Suspense>
    </div>
  );
}
