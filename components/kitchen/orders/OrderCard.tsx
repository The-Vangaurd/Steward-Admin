"use client";

import { memo, useMemo } from "react";
import { UtensilsCrossed, ShoppingBag, Bike, MapPin, StickyNote } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { StatusActions } from "./StatusActions";
import { ElapsedTimer } from "./ElapsedTimer";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { elapsedSeconds, elapsedLevel } from "@/utils/time";
import type { KitchenOrder, OrderType } from "@/types";

// Static lookup tables defined outside component — zero allocation on render
const ORDER_TYPE_META: Record<OrderType, { icon: React.ReactNode; label: string }> = {
  DINE_IN: { icon: <UtensilsCrossed className="h-3.5 w-3.5" />, label: "Dine In" },
  TAKEAWAY: { icon: <ShoppingBag className="h-3.5 w-3.5" />, label: "Takeaway" },
  DELIVERY: { icon: <Bike className="h-3.5 w-3.5" />, label: "Delivery" },
};

const STATUS_STRIP: Record<string, string> = {
  NEW: "border-l-[#D9B872]",
  PREPARING: "border-l-[#C8B6E2]",
  READY: "border-l-[#92B9A5]",
  CANCELLED: "border-l-[#B42318]",
};

const STATUS_TINT: Record<string, string> = {
  NEW: "shadow-[#D9B872]/5",
  PREPARING: "shadow-[#C8B6E2]/7",
  READY: "shadow-[#92B9A5]/7",
  CANCELLED: "shadow-[#B42318]/5",
};

interface OrderCardProps {
  order: KitchenOrder;
}

/**
 * Memoized KDS order card.
 * Only re-renders when `order` reference changes (i.e. when backend returns
 * a different object). Timer state is self-contained in ElapsedTimer.
 */
export const OrderCard = memo(function OrderCard({ order }: OrderCardProps) {
  const stripClass = STATUS_STRIP[order.status] ?? "border-l-white/10";
  const shadowClass = STATUS_TINT[order.status] ?? "";

  // Computed once per render — stable as long as order.createdAt doesn't change
  const { isUrgent, isNew } = useMemo(() => {
    const elapsed = elapsedSeconds(order.createdAt);
    const urgency = elapsedLevel(elapsed);
    return { isUrgent: urgency === "urgent", isNew: elapsed < 30 };
  }, [order.createdAt]);

  const typeMeta = ORDER_TYPE_META[order.orderType];

  // Memoize item count to avoid re-computing on every render
  const totalItemCount = useMemo(
    () => order.items.reduce((s, i) => s + i.quantity, 0),
    [order.items]
  );

  return (
    <article
      className={cn(
        "kds-card border-l-4 flex flex-col p-4 gap-0",
        stripClass,
        isUrgent && order.status === "NEW"
          ? "animate-pulse-urgent"
          : "",
        isNew && order.status === "NEW" ? "animate-pulse-pending" : "",
        "animate-kds-enter",
        "kds-hover-lift",
        `shadow-lg ${shadowClass}`
      )}
    >
      {/* Row 1: Order number + timer */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white tracking-tight leading-none">
              {order.orderNumber}
            </span>
            {isNew && (
              <span className="text-2xs font-bold uppercase tracking-widest text-[#C8B6E2] bg-[#C8B6E2]/10 px-1.5 py-0.5 rounded-full">
                New
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-white/45">
            <span className="text-white/30">{typeMeta.icon}</span>
            <span>{typeMeta.label}</span>
            {order.tableNumber && (
              <>
                <span className="text-white/20">·</span>
                <MapPin className="h-3 w-3 text-white/30" />
                <span className="font-semibold text-white/65">
                  Table {order.tableNumber}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <ElapsedTimer since={order.createdAt} />
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Row 2: Item list */}
      <ul className="space-y-2 border-t border-white/[0.06] pt-3 mb-1">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-2">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-base font-black text-[#C8B6E2] w-6 text-right flex-shrink-0 leading-tight">
                {item.quantity}×
              </span>
              <div className="min-w-0">
                <span className="text-sm font-medium text-white leading-tight block">
                  {item.name}
                </span>
                {item.notes && (
                  <span className="text-xs text-[#D9B872]/80 italic block mt-0.5">
                    {item.notes}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs text-white/30 flex-shrink-0 mt-0.5">
              {formatCurrency(item.price)}
            </span>
          </li>
        ))}
      </ul>

      {/* Row 3: Order notes */}
      {order.notes && (
        <div className="flex items-start gap-2 mt-2 rounded-lg bg-[#D9B872]/8 border border-[#D9B872]/15 px-3 py-2">
          <StickyNote className="h-3.5 w-3.5 text-[#D9B872] flex-shrink-0 mt-0.5" />
          <span className="text-xs text-[#D9B872]/90 leading-relaxed">
            {order.notes}
          </span>
        </div>
      )}

      {/* Row 4: Footer */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.06]">
        <span className="text-xs text-white/30">
          {totalItemCount} item{totalItemCount !== 1 ? "s" : ""}
        </span>
        <span className="text-sm font-bold text-white/80">
          {formatCurrency(order.totalAmount)}
        </span>
      </div>

      {/* Row 5: Actions */}
      <StatusActions order={order} />
    </article>
  );
});
