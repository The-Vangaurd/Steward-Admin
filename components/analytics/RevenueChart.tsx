"use client";

import { memo, useMemo } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import type { RevenueDataPoint } from "@/types";


const AreaChart = dynamic(
  () => import("recharts").then((m) => m.AreaChart as any),
  { ssr: false, loading: () => <Skeleton className="h-56 w-full" /> }
) as any;
const Area = dynamic(() => import("recharts").then((m) => m.Area as any), { ssr: false }) as any;
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis as any), { ssr: false }) as any;
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis as any), { ssr: false }) as any;
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid as any), { ssr: false }) as any;
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip as any), { ssr: false }) as any;
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer as any), { ssr: false }) as any;

const ACCENT = "#8B5CF6";
const GRID = "#232328";
const AXIS = "#71717A";

// Stable component reference — won't cause Tooltip to remount
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number | string }>;
  label?: string;
}

const CustomTooltip = memo(function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 shadow-elevated">
      <p className="mb-1 text-[10px] uppercase tracking-wider font-semibold text-fg-subtle">{label}</p>
      <p className="text-sm font-semibold text-fg num">₹{payload[0].value?.toLocaleString("en-IN")}</p>
    </div>
  );
});

interface RevenueChartProps { data?: RevenueDataPoint[]; loading?: boolean; }

export const RevenueChart = memo(function RevenueChart({ data, loading }: RevenueChartProps) {
  // Memoize formatted data — prevents re-formatting on parent re-render
  const formatted = useMemo(
    () =>
      data?.map((d) => ({
        ...d,
        label: format(new Date(d.date), "dd MMM"),
        revenue: typeof d.revenue === "string" ? parseFloat(d.revenue) : d.revenue,
      })),
    [data]
  );

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="label-xs mb-1">Revenue Trend</div>
          <p className="text-[11px] text-fg-subtle">Daily revenue over period</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="text-[11px] text-fg-muted font-medium">Revenue</span>
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-56 w-full" />
      ) : !formatted || formatted.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center gap-2">
          <p className="text-[13px] font-medium text-fg-muted">No revenue data</p>
          <p className="text-[11px] text-fg-subtle">Try selecting a wider date range</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={formatted} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={ACCENT} stopOpacity={0.25} />
                <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: ACCENT, strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Area type="monotone" dataKey="revenue" stroke={ACCENT} strokeWidth={2}
              fill="url(#revenueGrad)" dot={false}
              activeDot={{ r: 4, fill: ACCENT, strokeWidth: 2, stroke: "#0B0B0F" }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
});