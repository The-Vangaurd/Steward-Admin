"use client";

import { memo, useMemo } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { HourlyDataPoint } from "@/types";
import type { TooltipProps } from "recharts";

const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart as any), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar as any), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis as any), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis as any), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid as any), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip as any), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer as any), { ssr: false });

const GRID = "#232328";
const AXIS = "#71717A";

function formatHour(h: number) {
  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
}

const CustomTooltip = memo(function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 shadow-elevated">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-fg-subtle mb-1">{label}</p>
      <p className="text-sm font-semibold text-fg num">{payload[0].value} orders</p>
    </div>
  );
});

interface HourlyChartProps { data?: HourlyDataPoint[]; loading?: boolean; }

export const HourlyChart = memo(function HourlyChart({ data, loading }: HourlyChartProps) {
  const formatted = useMemo(
    () => data?.map((d) => ({ hour: formatHour(d.hour), count: d.count })),
    [data]
  );

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="label-xs mb-1">Busiest Hours</div>
          <p className="text-[11px] text-fg-subtle">Order volume by hour of day</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-info" />
          <span className="text-[11px] text-fg-muted font-medium">Orders</span>
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-44 w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={formatted} margin={{ top: 0, right: 5, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="hour" tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#16161B" }} />
            <Bar dataKey="count" fill="#3B82F6" radius={[3, 3, 0, 0]} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
});
