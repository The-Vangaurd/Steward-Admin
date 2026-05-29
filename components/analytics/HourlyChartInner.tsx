// components/analytics/HourlyChartInner.tsx — loaded once, all recharts in one chunk
"use client";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { memo, useMemo } from "react";
import type { HourlyDataPoint } from "@/types";

const GRID = "#232328";
const AXIS = "#71717A";

function formatHour(h: number) {
    if (h === 0) return "12a";
    if (h < 12) return `${h}a`;
    if (h === 12) return "12p";
    return `${h - 12}p`;
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 shadow-elevated">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-fg-subtle mb-1">{label}</p>
            <p className="text-sm font-semibold text-fg num">{payload[0].value} orders</p>
        </div>
    );
}

export default memo(function HourlyChartInner({ data }: { data?: HourlyDataPoint[] }) {
    const formatted = useMemo(
        () => data?.map((d) => ({ hour: formatHour(d.hour), count: d.count })),
        [data]
    );
    return (
        <ResponsiveContainer width="100%" height={180}>
            <BarChart data={formatted} margin={{ top: 0, right: 5, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#16161B" }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[3, 3, 0, 0]} maxBarSize={26} />
            </BarChart>
        </ResponsiveContainer>
    );
});