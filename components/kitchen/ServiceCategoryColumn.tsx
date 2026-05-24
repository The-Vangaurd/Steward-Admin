"use client";

import { ConciergeBell, CheckCircle2, Loader2 } from "lucide-react";
import { useKitchenQueuePartitions, useKitchenStatusMutation } from "@/hooks/useKitchenOrders";
import { useKitchenUndo } from "@/hooks/useKitchenUndo";
import { cn } from "@/lib/utils";
import { elapsedSeconds } from "@/utils/time";
import type { KitchenOrder } from "@/types";

interface ServiceCategoryColumnProps {
    /** Injected from the parent kitchen page so undo state is shared */
    captureSnapshot: (label: string) => void;
}

/**
 * Service Category Column
 *
 * Shows up to 4 READY orders awaiting table service.
 * Provides "Ready to Serve" and "Served" action buttons.
 *
 * API target: PATCH /api/orders/:id/kitchen-status
 */
export function ServiceCategoryColumn({ captureSnapshot }: ServiceCategoryColumnProps) {
    const { serviceCategoryOrders: orders, isLoading } = useKitchenQueuePartitions();
    const kitchenStatusMutation = useKitchenStatusMutation();

    const handleReadyToServe = async (order: KitchenOrder) => {
        captureSnapshot(`Ready to Serve #${order.orderNumber}`);
        await kitchenStatusMutation.mutateAsync({
            orderId: order.id,
            kitchenStatus: "READY_TO_SERVE",
        });
    };

    const handleServed = async (order: KitchenOrder) => {
        captureSnapshot(`Served #${order.orderNumber}`);
        await kitchenStatusMutation.mutateAsync({
            orderId: order.id,
            kitchenStatus: "SERVED",
        });
    };

    return (
        <div className="space-y-3">
            <ColumnHeader count={orders.length} />

            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-32 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse"
                        />
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="space-y-3">
                    {orders.map((order) => (
                        <ServiceOrderCard
                            key={order.id}
                            order={order}
                            onReadyToServe={() => handleReadyToServe(order)}
                            onServed={() => handleServed(order)}
                            isPending={
                                kitchenStatusMutation.isPending &&
                                (kitchenStatusMutation.variables as any)?.orderId === order.id
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Service Order Card ────────────────────────────────────────────────────────

function ServiceOrderCard({
    order,
    onReadyToServe,
    onServed,
    isPending,
}: {
    order: KitchenOrder;
    onReadyToServe: () => void;
    onServed: () => void;
    isPending: boolean;
}) {
    const elapsed = elapsedSeconds(order.createdAt);
    const mins = Math.floor(elapsed / 60);

    return (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-white">{order.orderNumber}</span>
                        <span className="text-xs font-medium text-[#92B9A5] bg-[#92B9A5]/10 px-2 py-0.5 rounded-full">
                            Ready
                        </span>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">
                        {order.tableNumber ? `Table ${order.tableNumber}` : order.orderType.replace("_", " ")}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-white/30">{mins}m ago</p>
                    <p className="text-xs text-white/20">
                        {order.items.reduce((s, i) => s + i.quantity, 0)} items
                    </p>
                </div>
            </div>

            {/* Items summary */}
            <ul className="space-y-1 border-t border-white/[0.05] pt-2">
                {order.items.slice(0, 3).map((item) => (
                    <li key={item.id} className="flex items-center gap-2 text-xs text-white/60">
                        <span className="font-bold text-[#C8B6E2]">{item.quantity}×</span>
                        <span className="truncate">{item.name}</span>
                    </li>
                ))}
                {order.items.length > 3 && (
                    <li className="text-[10px] text-white/30">
                        +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? "s" : ""}
                    </li>
                )}
            </ul>

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
                <button
                    onClick={onReadyToServe}
                    disabled={isPending}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all",
                        "bg-emerald-600 hover:bg-emerald-500 text-white",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                >
                    {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Ready to Serve
                </button>
                <button
                    onClick={onServed}
                    disabled={isPending}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all",
                        "bg-blue-600 hover:bg-blue-500 text-white",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                >
                    {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <ConciergeBell className="h-3.5 w-3.5" />
                    )}
                    Served
                </button>
            </div>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ColumnHeader({ count }: { count: number }) {
    return (
        <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#92B9A5]/10 border border-[#92B9A5]/20">
                    <ConciergeBell className="h-3.5 w-3.5 text-[#92B9A5]" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white">Service</h3>
                    <p className="text-[10px] text-white/35 uppercase tracking-wider">
                        Ready to Serve
                    </p>
                </div>
            </div>
            {count > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-black bg-[#92B9A5]/15 text-[#92B9A5]">
                    {count}
                </span>
            )}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <ConciergeBell className="h-5 w-5 text-white/20" />
            </div>
            <div>
                <p className="text-sm font-medium text-white/40">No orders ready</p>
                <p className="text-xs text-white/25 mt-1">Orders will appear when ready</p>
            </div>
        </div>
    );
}
