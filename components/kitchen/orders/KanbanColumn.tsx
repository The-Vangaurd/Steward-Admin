"use client";

import { memo } from "react";
import { OrderCardSkeleton } from "@/components/kitchen/orders/OrderCardSkeleton";
import { OrderCard } from "@/components/kitchen/orders/OrderCard";
import { cn } from "@/lib/utils";
import type { KitchenOrder, OrderStatus } from "@/types";

interface KanbanColumnProps {
  title: string;
  icon: React.ReactNode;
  orders: KitchenOrder[];
  status: OrderStatus;
  isLoading: boolean;
  accentColor: string;
  emptyText: string;
}

export const KanbanColumn = memo(function KanbanColumn({
  title,
  icon,
  orders,
  status,
  isLoading,
  accentColor,
  emptyText,
}: KanbanColumnProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-full overflow-hidden border-r border-white/[0.05] last:border-r-0"
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2">
          {icon}
          <span
            className="text-[13px] font-bold uppercase tracking-[0.12em]"
            style={{ color: accentColor }}
          >
            {title}
          </span>
        </div>
        {orders.length > 0 && (
          <span
            className="flex h-5 min-w-5 items-center justify-center rounded-full text-[11px] font-black px-1.5"
            style={{
              backgroundColor: `${accentColor}22`,
              color: accentColor,
            }}
          >
            {orders.length}
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <OrderCardSkeleton key={i} />
          ))
        ) : orders.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-[13px] text-white/20 font-medium">{emptyText}</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
            />
          ))
        )}
      </div>
    </div>
  );
});
