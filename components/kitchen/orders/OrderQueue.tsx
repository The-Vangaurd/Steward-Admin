"use client";

import { useMemo } from "react";
import { AlertCircle, ClipboardList, RefreshCw } from "lucide-react";
import { OrderCard } from "./OrderCard";
import { OrderCardSkeleton } from "./OrderCardSkeleton";
import { useKitchenOrders } from "@/hooks/useKitchenOrders";
import { cn } from "@/lib/utils";
import type { KitchenOrder, KitchenType, OrderStatus } from "@/types";

type QueueFilter = "all" | KitchenType | OrderStatus;

interface OrderQueueProps {
  filter?: QueueFilter;
}

const ACTIVE_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY"];

/** Sort: PENDING first, then CONFIRMED, PREPARING, READY; within status: oldest first */
const STATUS_SORT_ORDER: Record<OrderStatus, number> = {
  PENDING:   0,
  CONFIRMED: 1,
  PREPARING: 2,
  READY:     3,
  DELIVERED: 4,
  CANCELLED: 5,
};

function applyFilter(orders: KitchenOrder[], filter: QueueFilter): KitchenOrder[] {
  if (filter === "all") return orders;
  if (filter === "TIME_TAKING" || filter === "READY_TO_SERVE" || filter === "MAIN") {
    return orders.filter((o) =>
      o.items.some((item) => item.menuItem?.kitchenType === filter)
    );
  }
  return orders.filter((o) => o.status === filter);
}

function sortOrders(orders: KitchenOrder[]): KitchenOrder[] {
  return [...orders].sort((a, b) => {
    const statusDiff = STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function OrderQueue({ filter = "all" }: OrderQueueProps) {
  const { data: orders, isLoading, isError, error, refetch, isFetching } =
    useKitchenOrders();

  const filtered = useMemo(() => {
    if (!orders) return [];
    const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
    const f = applyFilter(active, filter);
    return sortOrders(f);
  }, [orders, filter]);

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 p-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────────────────────────── */
  if (isError) {
    const msg =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ?? "Failed to load kitchen queue";
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D18B8B]/10 border border-[#D18B8B]/15">
          <AlertCircle className="h-8 w-8 text-[#D18B8B]" />
        </div>
        <div>
          <p className="text-lg font-semibold text-white">Could not load orders</p>
          <p className="text-sm text-white/45 mt-1">{msg}</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl",
            "bg-white/8 hover:bg-white/12 border border-white/10",
            "text-sm font-medium text-white/80",
            "transition-colors duration-150",
            "disabled:opacity-50"
          )}
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          Retry
        </button>
      </div>
    );
  }

  /* ── Empty ───────────────────────────────────────────────────────────── */
  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-28 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/[0.03] border border-white/[0.06]">
          <ClipboardList className="h-9 w-9 text-white/20" />
        </div>
        <div>
          <p className="text-xl font-semibold text-white/40">All clear</p>
          <p className="text-sm text-white/25 mt-1.5">
            New orders will appear here in real-time
          </p>
        </div>
      </div>
    );
  }

  /* ── Queue grid ──────────────────────────────────────────────────────── */
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 p-1">
      {filtered.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
