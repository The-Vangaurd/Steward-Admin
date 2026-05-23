"use client";

import { Loader2 } from "lucide-react";
import { useOrderStatus } from "@/hooks/useOrderStatus";
import { ORDER_STATUS_FLOW, STATUS_ACTION_LABELS } from "@/types";
import type { OrderStatus, KitchenOrder } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Large touch-friendly action buttons — glove-safe, tablet-optimised.
 * Primary action is full-width, cancel is a secondary destructive option.
 */

const ACTION_STYLES: Partial<Record<OrderStatus, string>> = {
  PENDING:   "bg-[#C8B6E2] hover:bg-[#D8CAE9] active:bg-[#B7A1D6] text-[#17141E]",
  CONFIRMED: "bg-[#A994C8] hover:bg-[#B8A6D1] active:bg-[#937AB7] text-white",
  PREPARING: "bg-[#92B9A5] hover:bg-[#A4C6B5] active:bg-[#7EA891] text-[#101610]",
  READY:     "bg-[#9BAED2] hover:bg-[#AEBEDD] active:bg-[#879CC4] text-[#10141D]",
};

interface StatusActionsProps {
  order: KitchenOrder;
}

export function StatusActions({ order }: StatusActionsProps) {
  const { mutate, isPending, variables } = useOrderStatus();

  const nextStatuses = ORDER_STATUS_FLOW[order.status];
  if (nextStatuses.length === 0) return null;

  const primaryNext = nextStatuses[0] as OrderStatus;
  const primaryLabel = STATUS_ACTION_LABELS[order.status];
  const isPrimaryPending =
    isPending &&
    variables?.orderId === order.id &&
    variables?.input.status === primaryNext;
  const isCancelPending =
    isPending &&
    variables?.orderId === order.id &&
    variables?.input.status === "CANCELLED";

  const handleAction = (status: OrderStatus) => {
    mutate({ orderId: order.id, input: { status } });
  };

  return (
    <div className="flex gap-2 pt-3 mt-2 border-t border-white/[0.06]">
      {/* Primary action — full width, large touch target */}
      {primaryLabel && (
        <button
          disabled={isPending}
          onClick={() => handleAction(primaryNext)}
          className={cn(
            "flex-1 touch-target flex items-center justify-center gap-2",
            "rounded-xl text-sm font-bold tracking-wide uppercase",
            "transition-all duration-150 ease-out",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
            ACTION_STYLES[order.status] ?? "bg-white/10 hover:bg-white/15 text-white"
          )}
        >
          {isPrimaryPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            primaryLabel
          )}
        </button>
      )}

      {/* Cancel — only for PENDING, smaller destructive button */}
      {order.status === "PENDING" && (
        <button
          disabled={isPending}
          onClick={() => handleAction("CANCELLED")}
          className={cn(
            "touch-target flex items-center justify-center px-4",
            "rounded-xl text-sm font-semibold",
            "bg-[#D18B8B]/10 hover:bg-[#D18B8B]/16 active:bg-[#D18B8B]/22",
            "text-[#D18B8B] border border-[#D18B8B]/20",
            "transition-all duration-150 ease-out",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D18B8B]/30"
          )}
        >
          {isCancelPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Cancel"
          )}
        </button>
      )}
    </div>
  );
}
