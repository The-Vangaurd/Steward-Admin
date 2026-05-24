"use client";

import { ShoppingBag } from "lucide-react";
import { useKitchenQueuePartitions } from "@/hooks/useKitchenOrders";
import { OrderCard } from "@/components/kitchen/orders/OrderCard";
import { cn } from "@/lib/utils";

/**
 * TakeawayCounter
 *
 * Isolated display for TAKEAWAY orders.
 * Lives in the third column below the Dosa/Grills section.
 * Updates live via socket invalidations.
 */
export function TakeawayCounter() {
    const { takeawayOrders: orders, isLoading } = useKitchenQueuePartitions();

    return (
        <div className="space-y-3">
            <Header count={orders.length} />

            {isLoading ? (
                <div className="h-16 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
            ) : orders.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="space-y-3">
                    {/* Counter badge */}
                    <div
                        className={cn(
                            "flex items-center justify-between rounded-xl border px-4 py-3",
                            orders.length > 0
                                ? "bg-[#9BAED2]/10 border-[#9BAED2]/20"
                                : "bg-white/[0.02] border-white/[0.06]"
                        )}
                    >
                        <span className="text-sm font-medium text-white/70">
                            Pending Takeaway
                        </span>
                        <span className="text-2xl font-black text-[#9BAED2]">
                            {orders.length}
                        </span>
                    </div>

                    {/* Order cards */}
                    {orders.map((order) => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Header({ count }: { count: number }) {
    return (
        <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#9BAED2]/10 border border-[#9BAED2]/20">
                    <ShoppingBag className="h-3.5 w-3.5 text-[#9BAED2]" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white">Takeaway</h3>
                    <p className="text-[10px] text-white/35 uppercase tracking-wider">
                        Isolated Queue
                    </p>
                </div>
            </div>
            {count > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-black bg-[#9BAED2]/15 text-[#9BAED2]">
                    {count}
                </span>
            )}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
            <ShoppingBag className="h-5 w-5 text-white/15 flex-shrink-0" />
            <p className="text-xs text-white/30">No takeaway orders</p>
        </div>
    );
}
