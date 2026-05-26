"use client";

import { memo, useMemo, useCallback } from "react";
import { ChefHat, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useKitchenOrders, KITCHEN_ORDERS_QUERY_KEY } from "@/hooks/useKitchenOrders";
import { partitionDosaQueue, CURRENT_DOSA_CAP } from "@/lib/dosaQueue";
import { DosaOrderSection } from "@/components/kitchen/DosaOrderSection";
import { OrderCardSkeleton } from "@/components/kitchen/orders/OrderCardSkeleton";
import { ConnectionStatus } from "@/components/kitchen/layout/ConnectionStatus";
import { cn } from "@/lib/utils";

export function DosaCounterView() {
  const { data: orders = [], isLoading, isError } = useKitchenOrders();
  const queryClient = useQueryClient();

  // Memoize expensive partition — only recalculates when orders change
  const { current, upcoming } = useMemo(() => partitionDosaQueue(orders), [orders]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: KITCHEN_ORDERS_QUERY_KEY });
  }, [queryClient]);

  return (
    <div className="flex flex-col h-full overflow-hidden px-5 py-5 lg:px-6 lg:py-6">
      <div className="flex items-center justify-between flex-shrink-0 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D9B872]/10 border border-[#D9B872]/20">
            <ChefHat className="h-4.5 w-4.5 text-[#D9B872]" />
          </div>
          <div>
            <div className="label-xs mb-0.5">Kitchen</div>
            <h2 className="text-xl font-semibold tracking-tight text-fg">
              Dosa Counter
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ConnectionStatus />
          <button
            onClick={handleRefresh}
            className={cn(
              "flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/[0.08]",
              "bg-white/[0.03] text-white/50 hover:bg-white/[0.07] hover:text-white/80",
              "text-xs font-medium transition-colors"
            )}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <CapBar current={current} />

      <div className="flex-1 overflow-y-auto scrollbar-thin mt-5">
        {isLoading ? (
          <LoadingSkeleton />
        ) : isError ? (
          <ErrorState onRetry={handleRefresh} />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-6 items-start">
            <DosaOrderSection variant="current" orders={current} />
            <div className="hidden xl:block absolute inset-y-0 left-1/2 w-px bg-white/[0.06]" aria-hidden />
            <DosaOrderSection variant="upcoming" orders={upcoming} />
          </div>
        )}
      </div>
    </div>
  );
}

// Memoized cap bar — only re-renders when current orders change
const CapBar = memo(function CapBar({
  current,
}: {
  current: ReturnType<typeof partitionDosaQueue>["current"];
}) {
  const safeCurrentOrders = current ?? [];

  const currentQty = useMemo(
    () =>
      safeCurrentOrders
        .flatMap((o) => o.items)
        .filter((i) => i.name.toLowerCase().includes("dosa") || (i.menuItem as any)?.kitchenType === "TIME_TAKING")
        .reduce((s, i) => s + i.quantity, 0),
    [safeCurrentOrders]
  );

  const pct = Math.min(100, (currentQty / CURRENT_DOSA_CAP) * 100);
  const isFull = currentQty >= CURRENT_DOSA_CAP;

  return (
    <div className="flex-shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
          Current Batch Capacity
        </span>
        <span
          className={cn(
            "text-sm font-black tabular-nums",
            isFull ? "text-[#D9B872]" : "text-white/60"
          )}
        >
          {currentQty}
          <span className="text-xs font-medium text-white/30">
            {" "}/ {CURRENT_DOSA_CAP}
          </span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isFull ? "bg-[#D9B872]" : "bg-[#D9B872]/50"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isFull && (
        <p className="text-[10px] text-[#D9B872]/70 mt-1.5 font-medium">
          Batch full — new orders flow to Upcoming
        </p>
      )}
    </div>
  );
});

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div className="h-4 w-20 rounded bg-white/[0.06] animate-pulse" />
        <div className="h-24 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
        {[...Array(2)].map((_, i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>
      <div className="space-y-4">
        <div className="h-4 w-20 rounded bg-white/[0.06] animate-pulse" />
        <div className="h-24 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
        {[...Array(2)].map((_, i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] py-16 text-center">
      <ChefHat className="h-8 w-8 text-white/20" />
      <div>
        <p className="text-sm font-medium text-white/50">
          Failed to load kitchen orders
        </p>
        <p className="text-xs text-white/30 mt-1">
          Check your connection and try again
        </p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 rounded-lg bg-white/8 px-4 py-2 text-xs font-medium text-white/70 hover:bg-white/12 transition-colors border border-white/10"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
    </div>
  );
}
