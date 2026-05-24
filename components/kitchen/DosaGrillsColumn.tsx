"use client";

import { Flame } from "lucide-react";
import { useKitchenQueuePartitions } from "@/hooks/useKitchenOrders";
import { cn } from "@/lib/utils";
import type { DosaGrillAggregatedItem } from "@/hooks/useKitchenOrders";

/**
 * Dosa / Grills Column
 *
 * Aggregates all TIME_TAKING items across active orders.
 * Splits into PRIORITY (top 3 order batch) and NEXT ORDERS.
 * Items are grouped and totalled for efficient kitchen prep.
 */
export function DosaGrillsColumn() {
    const { dosaGrillAggregation: items, isLoading } = useKitchenQueuePartitions();

    const priorityItems = items.filter((i) => i.isPriority);
    const nextItems = items.filter((i) => !i.isPriority);

    return (
        <div className="space-y-3">
            <ColumnHeader count={items.length} />

            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] animate-pulse"
                        />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="space-y-4">
                    {/* Priority batch */}
                    {priorityItems.length > 0 && (
                        <Section
                            title="Priority"
                            titleColor="text-[#D9B872]"
                            bgColor="bg-[#D9B872]/10"
                            borderColor="border-[#D9B872]/20"
                            dotColor="bg-[#D9B872]"
                            items={priorityItems}
                        />
                    )}

                    {/* Next orders batch */}
                    {nextItems.length > 0 && (
                        <Section
                            title="Next Orders"
                            titleColor="text-white/50"
                            bgColor="bg-white/[0.02]"
                            borderColor="border-white/[0.06]"
                            dotColor="bg-white/30"
                            items={nextItems}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

// ── Section ───────────────────────────────────────────────────────────────────

function Section({
    title,
    titleColor,
    bgColor,
    borderColor,
    dotColor,
    items,
}: {
    title: string;
    titleColor: string;
    bgColor: string;
    borderColor: string;
    dotColor: string;
    items: DosaGrillAggregatedItem[];
}) {
    return (
        <div className={cn("rounded-xl border p-3 space-y-2", bgColor, borderColor)}>
            <div className="flex items-center gap-2 mb-1">
                <div className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
                <span className={cn("text-[10px] font-bold uppercase tracking-widest", titleColor)}>
                    {title}
                </span>
            </div>
            {items.map((item) => (
                <AggregatedItem key={item.name} item={item} />
            ))}
        </div>
    );
}

function AggregatedItem({ item }: { item: DosaGrillAggregatedItem }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2">
            <span className="text-sm text-white/80 truncate">{item.name}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-lg font-black text-[#D9B872]">
                    {item.totalQuantity}
                </span>
                <span className="text-xs text-white/30">pcs</span>
            </div>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ColumnHeader({ count }: { count: number }) {
    return (
        <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D9B872]/10 border border-[#D9B872]/20">
                    <Flame className="h-3.5 w-3.5 text-[#D9B872]" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white">Dosa / Grills</h3>
                    <p className="text-[10px] text-white/35 uppercase tracking-wider">
                        Aggregated Queue
                    </p>
                </div>
            </div>
            {count > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-black bg-[#D9B872]/15 text-[#D9B872]">
                    {count}
                </span>
            )}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] py-10 text-center">
            <Flame className="h-6 w-6 text-white/15" />
            <p className="text-xs text-white/30">No dosa/grill items pending</p>
        </div>
    );
}
