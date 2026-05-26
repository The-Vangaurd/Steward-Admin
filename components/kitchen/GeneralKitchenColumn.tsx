"use client";

import { ClipboardList, RefreshCw } from "lucide-react";
import { memo } from "react";
import { OrderCard } from "@/components/kitchen/orders/OrderCard";
import { OrderCardSkeleton } from "@/components/kitchen/orders/OrderCardSkeleton";
import { useKitchenQueuePartitions } from "@/hooks/useKitchenOrders";
import { useQueryClient } from "@tanstack/react-query";
import { KITCHEN_ORDERS_QUERY_KEY } from "@/hooks/useKitchenOrders";
import { cn } from "@/lib/utils";

export function GeneralKitchenColumn() {
  const { generalKitchenOrders: orders, isLoading, isError } = useKitchenQueuePartitions();
  const queryClient = useQueryClient();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <ColumnHeader count={0} loading />
        {Array.from({ length: 3 }).map((_, i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <ColumnHeader count={0} />
        <div className="flex flex-col items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] py-12 text-center">
          <p className="text-sm text-white/50">Failed to load orders</p>
          <button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: KITCHEN_ORDERS_QUERY_KEY })
            }
            className="flex items-center gap-1.5 rounded-lg bg-white/8 px-4 py-2 text-xs font-medium text-white/70 hover:bg-white/12 transition-colors border border-white/10"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ColumnHeader count={orders.length} />

      {orders.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

// Memoized static sub-components
const ColumnHeader = memo(function ColumnHeader({
  count,
  loading = false,
}: {
  count: number;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pb-1">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C8B6E2]/10 border border-[#C8B6E2]/20">
          <ClipboardList className="h-3.5 w-3.5 text-[#C8B6E2]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">General Orders</h3>
          <p className="text-[10px] text-white/35 uppercase tracking-wider">
            Top 3 Active
          </p>
        </div>
      </div>
      {!loading && count > 0 && (
        <span
          className={cn(
            "flex h-6 min-w-6 items-center justify-center rounded-full px-1.5",
            "text-[11px] font-black",
            "bg-[#C8B6E2]/15 text-[#C8B6E2]"
          )}
        >
          {count}
        </span>
      )}
    </div>
  );
});

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        <ClipboardList className="h-5 w-5 text-white/20" />
      </div>
      <div>
        <p className="text-sm font-medium text-white/40">All clear</p>
        <p className="text-xs text-white/25 mt-1">New orders appear in real-time</p>
      </div>
    </div>
  );
}
