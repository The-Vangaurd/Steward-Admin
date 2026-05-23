"use client";

import { memo } from "react";
import { UtensilsCrossed, ShoppingBag, Bike, MapPin, StickyNote } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { StatusActions } from "./StatusActions";
import { ElapsedTimer } from "./ElapsedTimer";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { elapsedSeconds, elapsedLevel } from "@/utils/time";
import type { KitchenOrder, OrderType } from "@/types";

const ORDER_TYPE_META: Record<OrderType, { icon: React.ReactNode; label: string }> = {
  DINE_IN:  { icon: <UtensilsCrossed className="h-3.5 w-3.5" />, label: "Dine In" },
  TAKEAWAY: { icon: <ShoppingBag className="h-3.5 w-3.5" />,     label: "Takeaway" },
  DELIVERY: { icon: <Bike className="h-3.5 w-3.5" />,            label: "Delivery" },
};

/** Left strip colour per status */
const STATUS_STRIP: Record<string, string> = {
  PENDING:   "border-l-[#D9B872]",
  CONFIRMED: "border-l-[#9BAED2]",
  PREPARING: "border-l-[#C8B6E2]",
  READY:     "border-l-[#92B9A5]",
};

/** Subtle card tint per status for ambient depth */
const STATUS_TINT: Record<string, string> = {
  PENDING:   "shadow-[#D9B872]/5",
  CONFIRMED: "shadow-[#9BAED2]/5",
  PREPARING: "shadow-[#C8B6E2]/7",
  READY:     "shadow-[#92B9A5]/7",
};

interface OrderCardProps {
  order: KitchenOrder;
}

/**
 * Premium KDS order card.
 *
 * Visual hierarchy:
 *   1. Order number (dominant) + table/type
 *   2. Elapsed timer (live, urgency-coded)
 *   3. Status badge
 *   4. Item list (readable, quantity-first)
 *   5. Notes (amber callout)
 *   6. Total + item count
 *   7. Action buttons (large, glove-safe)
 */
export const OrderCard = memo(function OrderCard({ order }: OrderCardProps) {
  const stripClass = STATUS_STRIP[order.status] ?? "border-l-white/10";
  const shadowClass = STATUS_TINT[order.status] ?? "";
  const elapsed = elapsedSeconds(order.createdAt);
  const urgency = elapsedLevel(elapsed);
  const isUrgent = urgency === "urgent";
  const isNew = elapsed < 30; // just placed

  const typeMeta = ORDER_TYPE_META[order.orderType];

  return (
    <article
      className={cn(
        // Base card surface
        "kds-card border-l-4 flex flex-col p-4 gap-0",
        // Status strip
        stripClass,
        // Urgency pulse — only for PENDING/CONFIRMED that are overdue
        isUrgent && (order.status === "PENDING" || order.status === "CONFIRMED")
          ? "animate-pulse-urgent"
          : "",
        // Soft pulse for fresh pending orders
        isNew && order.status === "PENDING" ? "animate-pulse-pending" : "",
        // Entry animation
        "animate-kds-enter",
        // Hover lift
        "kds-hover-lift",
        // Shadow glow
        `shadow-lg ${shadowClass}`
      )}
    >
      {/* ── Row 1: Order number + timer ───────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          {/* Large order number — dominant scan target */}
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
          {/* Order type + table */}
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

        {/* Timer + status — right-aligned */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <ElapsedTimer since={order.createdAt} />
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* ── Row 2: Item list ──────────────────────────────────────────── */}
      <ul className="space-y-2 border-t border-white/[0.06] pt-3 mb-1">
        {order.items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-2"
          >
            <div className="flex items-baseline gap-2 min-w-0">
              {/* Quantity — prominent */}
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

      {/* ── Row 3: Order notes (if any) ───────────────────────────────── */}
      {order.notes && (
        <div className="flex items-start gap-2 mt-2 rounded-lg bg-[#D9B872]/8 border border-[#D9B872]/15 px-3 py-2">
          <StickyNote className="h-3.5 w-3.5 text-[#D9B872] flex-shrink-0 mt-0.5" />
          <span className="text-xs text-[#D9B872]/90 leading-relaxed">
            {order.notes}
          </span>
        </div>
      )}

      {/* ── Row 4: Footer — item count + total ───────────────────────── */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.06]">
        <span className="text-xs text-white/30">
          {order.items.reduce((s, i) => s + i.quantity, 0)} item
          {order.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}
        </span>
        <span className="text-sm font-bold text-white/80">
          {formatCurrency(order.totalAmount)}
        </span>
      </div>

      {/* ── Row 5: Actions ────────────────────────────────────────────── */}
      <StatusActions order={order} />
    </article>
  );
});
