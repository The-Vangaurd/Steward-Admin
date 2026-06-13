"use client";

import { useState, useMemo, useCallback, Suspense, lazy } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import {
  IndianRupee, ShoppingBag, CheckCircle2, XCircle, Clock,
  ArrowRight, X, RefreshCw, Zap, BarChart3,
} from "lucide-react";
import Link from "next/link";
import { KpiCard } from "@/components/analytics/KpiCard";
import type { AnalyticsSummary, HourlyDataPoint } from "@/types";
import { RecentOrdersTable } from "@/components/analytics/RecentOrdersTable";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAnalyticsSummary, useRevenueData, useTopItems,
} from "@/hooks/useAnalytics";
import { useAuthStore } from "@/stores/auth.store";
import { useSettingsStore } from "@/stores/settings.store";
import api from "@/lib/axios";
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

// Persist onboarding dismissal in localStorage so it survives page reloads.
const ONBOARDING_KEY = "steward-onboarding-dismissed";

function readDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(ONBOARDING_KEY) === "true"; } catch { return false; }
}

function writeDismissed() {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(ONBOARDING_KEY, "true"); } catch { /* quota */ }
}

const ChartSkeleton = () => <Skeleton className="h-56 w-full rounded-xl bg-surface-2" />;

export default function DashboardPage() {
  const user       = useAuthStore((s) => s.user);
  const restaurant = useAuthStore((s) => s.restaurant);
  const { wsConnected } = useSettingsStore();
  const queryClient = useQueryClient();

  // ORDER_CREATED toast notification is handled by useSocket({ enabled: isAdmin && isDashboard })
  // called in the dashboard layout — no duplicate listener needed here (FIX 7.5).

  // ── Onboarding: persisted dismissal ───────────────────────────────────────
  // Initialise synchronously from localStorage so there's no flash.
  const [onboardingDismissed, setOnboardingDismissed] = useState(readDismissed);

  const dismissOnboarding = useCallback(() => {
    writeDismissed();
    setOnboardingDismissed(true);
  }, []);

  // ── Date range ─────────────────────────────────────────────────────────────
  // Default to "today" so the live dashboard is the first thing admins see.
  const [activeRange, setActiveRange] = useState<QuickRange>("today");
  const params  = useMemo(() => getRange(activeRange), [activeRange]);

  // Pass activeRange to hooks so they can use a shorter staleTime + auto-poll.
  const summary  = useAnalyticsSummary(params, activeRange);
  const revenue  = useRevenueData(params, activeRange);
  const topItems = useTopItems(params, activeRange);

  // ── Menu items (for onboarding check) ─────────────────────────────────────
  const menuQuery = useQuery({
    queryKey: ["admin-menu-items"],
    queryFn: async () => {
      const res = await api.get("/menu/admin/items");
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  /**
   * All-time orders check — range-independent.
   *
   * Bug fixed: previously `orderCount` came from the date-range analytics
   * summary, so switching to "today" with zero orders (but past orders
   * existing) would re-show the onboarding banner incorrectly.
   * Now we do a single, separate query that isn't tied to the active range.
   */
  const allTimeOrdersQuery = useQuery({
    queryKey: ["all-time-orders-check"],
    queryFn: async () => {
      const res = await api.get("/orders/admin/list", { params: { limit: 1, page: 1 } });
      return (res.data?.data?.length ?? 0) > 0;
    },
    staleTime: 60_000,
    // Skip fetching if the user has already dismissed the banner.
    enabled: !onboardingDismissed,
  });

  const loading        = summary.isLoading || menuQuery.isLoading;
  const d              = summary.data;
  const cancelRate     = d ? d.cancellationRate.toFixed(1) : null;
  const menuItemCount  = (menuQuery.data as any)?.length ?? 0;
  const hasAnyOrders   = allTimeOrdersQuery.data ?? false;

  // Live active order count (for header badge)
  const { data: liveActiveCount = 0 } = useQuery<number>({
    queryKey: ["dashboard-live-active-count"],
    queryFn: async () => {
      const { data } = await api.get<any>("/orders/admin/list", {
        params: { limit: 1, page: 1, status: "NEW,PREPARING" },
      });
      return data.meta?.total ?? 0;
    },
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  // Hourly distribution
  const { data: hourlyData } = useQuery<HourlyDataPoint[]>({
    queryKey: ["analytics-hourly", params],
    queryFn: async () => {
      const { data } = await api.get<any>("/admin/analytics/hourly", { params });
      return data.data as HourlyDataPoint[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const maxHourly = useMemo(() => {
    if (!hourlyData || hourlyData.length === 0) return 1;
    return Math.max(...hourlyData.map((h: HourlyDataPoint) => h.count), 1);
  }, [hourlyData]);

  /**
   * Show onboarding banner only when:
   * 1. Not already dismissed.
   * 2. Not still loading.
   * 3. The restaurant has NO menu items yet.
   * (we don't hide it just because there are no orders in the active date range)
   */
  const showOnboarding = !onboardingDismissed && !loading && menuItemCount === 0;

  // ── Refresh handler ────────────────────────────────────────────────────────
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["analytics-summary"] });
    await queryClient.invalidateQueries({ queryKey: ["analytics-revenue"] });
    await queryClient.invalidateQueries({ queryKey: ["analytics-top-items"] });
    await queryClient.invalidateQueries({ queryKey: ["recent-orders-table"] });
    setIsRefreshing(false);
  }, [queryClient]);

  function RangeToggle() {
    return (
      <div className="inline-flex items-center rounded-full border border-border bg-surface p-0.5">
        {QUICK_RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setActiveRange(r.value)}
            className={cn(
              "h-7 px-3.5 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all duration-150",
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
    <div className="px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 space-y-4 sm:space-y-5 max-w-[1400px] mx-auto">

      {/* ── Header ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-border">
        <div className="min-w-0">
          <div className="label-xs mb-1">{restaurant?.name ?? "Restaurant"}</div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-fg truncate">
              {getGreeting()}, {user?.firstName ?? "there"}.
            </h2>
            {liveActiveCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning animate-pulse shrink-0">
                <Zap className="h-2.5 w-2.5" />
                {liveActiveCount} active
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">

          {/* Manual refresh button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing || summary.isFetching}
            title="Refresh analytics"
            className="hidden sm:flex items-center justify-center h-8 w-8 rounded-full border border-border bg-surface text-fg-muted hover:text-fg hover:border-border-strong transition-colors disabled:opacity-40"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", (isRefreshing || summary.isFetching) && "animate-spin")} />
          </button>

          <RangeToggle />
        </div>
      </div>

      {/* ── Onboarding Checklist ─────────────────────────────────────────────
           Only shown for brand-new restaurants (no menu items yet).
           Dismissal is persisted in localStorage so it never reappears.
      ──────────────────────────────────────────────────────────────────────── */}
      {showOnboarding && (
        <div className="relative mb-2 rounded-xl border border-accent/20 bg-accent/5 p-5">
          <button
            type="button"
            onClick={dismissOnboarding}
            className="absolute right-3 top-3 rounded-full p-2 text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
            aria-label="Dismiss onboarding checklist"
          >
            <X className="h-4 w-4" />
          </button>
          <h3 className="text-[13px] font-semibold text-fg mb-1">
            Welcome — let&apos;s get your restaurant live
          </h3>
          <p className="text-[12px] text-fg-muted mb-4">
            Three steps and you&apos;ll be taking orders.
          </p>
          <div className="space-y-2">
            {[
              {
                label: "Add your first menu item",
                href:  "/menu",
                // Done when there's at least one menu item.
                done:  menuItemCount > 0,
              },
              {
                label: "Share your QR code with customers",
                href:  "/settings?tab=general",
                // Done when the restaurant has a slug (QR setup complete).
                done:  !!restaurant?.slug,
              },
              {
                label: "Watch your first order come in",
                href:  "/orders",
                // Done when there are orders in any time range — range-independent.
                done:  hasAnyOrders,
              },
            ].map((step, i) => (
              <Link
                key={i}
                href={step.href}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 hover:bg-surface-2 transition-colors group"
              >
                <span className={cn(
                  "h-5 w-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0",
                  step.done
                    ? "bg-success border-success/30 text-white"
                    : "border-border text-fg-subtle"
                )}>
                  {step.done ? "✓" : i + 1}
                </span>
                <span className={cn(
                  "text-[13px] font-medium",
                  step.done ? "line-through text-fg-subtle" : "text-fg"
                )}>
                  {step.label}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-fg-subtle ml-auto group-hover:text-fg transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}



      {/* ── KPI Cards ─────────────────────────────────────────────────────────────── */}
      {/* Revenue spans full width on mobile, then joins 2-col on sm, 5-col on xl */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Revenue — full-width hero card on mobile */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-1">
          <KpiCard
            title="Revenue"
            value={d ? formatCurrency(d.totalRevenue) : "₹0.00"}
            icon={IndianRupee}
            loading={loading}
            accent="accent"
            size="lg"
            description={activeRange === "today" ? "today so far" : undefined}
          />
        </div>
        <KpiCard
          title="Orders"
          value={d ? String(d.totalOrders) : "0"}
          icon={ShoppingBag}
          loading={loading}
          accent="info"
        />
        <KpiCard
          title="Completed"
          value={d ? String(d.completedOrders) : "0"}
          icon={CheckCircle2}
          loading={loading}
          accent="success"
          description={
            d && d.totalOrders > 0
              ? `${((d.completedOrders / d.totalOrders) * 100).toFixed(0)}% completion`
              : undefined
          }
        />
        <KpiCard
          title="Cancel Rate"
          value={cancelRate ? `${cancelRate}%` : "0.0%"}
          icon={XCircle}
          loading={loading}
          accent="danger"
        />
        <KpiCard
          title="Avg Prep Time"
          value={d ? `${d.avgPrepTimeMins.toFixed(0)}m` : "0m"}
          icon={Clock}
          loading={loading}
          accent="warning"
        />
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart data={revenue.data} loading={revenue.isLoading} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <TopItemsChart data={topItems.data} loading={topItems.isLoading} />
        </Suspense>
      </div>

      {/* ── Hourly Distribution ───────────────────────────────────────────────────────── */}
      {hourlyData && hourlyData.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-accent" />
            <span className="text-[13px] font-semibold text-fg">Orders by Hour</span>
            <span className="hidden sm:inline text-[11px] text-fg-subtle ml-1">Peak activity distribution</span>
          </div>
          <div className="flex items-end gap-0.5 sm:gap-1 h-20 sm:h-24">
            {Array.from({ length: 24 }, (_, hour) => {
              const entry = hourlyData.find((h: HourlyDataPoint) => h.hour === hour);
              const count = entry?.count ?? 0;
              const pct = (count / maxHourly) * 100;
              const isPeak = count === maxHourly && maxHourly > 0;
              return (
                <div key={hour} className="flex flex-col items-center gap-1 flex-1 group">
                  <div
                    className={cn(
                      "w-full rounded-t-sm transition-all duration-300",
                      isPeak ? "bg-accent" : count > 0 ? "bg-accent/40" : "bg-surface-3",
                    )}
                    style={{ height: `${Math.max(pct, count > 0 ? 8 : 4)}%` }}
                    title={`${hour}:00 — ${count} orders`}
                  />
                  {hour % 6 === 0 && (
                    <span className="sm:hidden text-[7px] text-fg-subtle num">{hour}h</span>
                  )}
                  {hour % 4 === 0 && (
                    <span className="hidden sm:inline text-[8px] text-fg-subtle num">{hour}h</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Order List ─────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-[15px] font-semibold text-fg">Order List</h3>
        <RecentOrdersTable params={params} activeRange={activeRange} />
      </div>
    </div>
  );
}
