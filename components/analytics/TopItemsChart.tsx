"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, TooltipProps } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { TopItem } from "@/types";

interface TopItemsChartProps { data?: TopItem[]; loading?: boolean; }

const COLORS = ["#8B5CF6", "#7C3AED", "#A78BFA", "#C4B5FD", "#DDD6FE"];
const GRID = "#232328";
const AXIS = "#71717A";

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 shadow-elevated">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-fg-subtle mb-1">{payload[0]?.payload?.name}</p>
      <p className="text-sm font-semibold text-fg num">{payload[0].value} sold</p>
    </div>
  );
}

export function TopItemsChart({ data, loading }: TopItemsChartProps) {
  const formatted = data?.map((d) => ({
    name: d.name.length > 18 ? d.name.slice(0, 18) + "…" : d.name,
    qty: d.totalQuantity,
  }));

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-4">
        <div className="label-xs mb-1">Top Items</div>
        <p className="text-[11px] text-fg-subtle">Most ordered in period</p>
      </div>
      {loading ? (
        <Skeleton className="h-56 w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={formatted} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#A1A1AA" }} width={110} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#16161B" }} />
            <Bar dataKey="qty" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {formatted?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
