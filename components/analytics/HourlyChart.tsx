// components/analytics/HourlyChart.tsx — corrected single-bundle approach
"use client";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { HourlyDataPoint } from "@/types";
import { memo } from "react";

const HourlyChartInner = dynamic(() => import("./HourlyChartInner"), {
  ssr: false,
  loading: () => <Skeleton className="h-44 w-full" />,
});

interface HourlyChartProps { data?: HourlyDataPoint[]; loading?: boolean; }

export const HourlyChart = memo(function HourlyChart({ data, loading }: HourlyChartProps) {
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
        <HourlyChartInner data={data} />
      )}
    </div>
  );
});