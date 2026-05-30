"use client";

import { Loader2 } from "lucide-react";
import { useCallback, memo } from "react";
import { useKitchenStatusMutation } from "@/hooks/useKitchenOrders";
import { ORDER_STATUS_FLOW, STATUS_ACTION_LABELS } from "@/types";
import type { OrderStatus, KitchenOrder } from "@/types";
import { cn } from "@/lib/utils";
import { useKitchenUndo } from "@/hooks/useKitchenUndo";

const ACTION_STYLES: Partial<Record<OrderStatus, string>> = {
  NEW:       "bg-[#C8B6E2] hover:bg-[#D8CAE9] active:bg-[#B7A1D6] text-[#17141E]",
  PREPARING: "bg-[#92B9A5] hover:bg-[#A4C6B5] active:bg-[#7EA891] text-[#101610]",
  READY:     "bg-[#9BAED2] hover:bg-[#AEBEDD] active:bg-[#879CC4] text-[#10141D]",
};

interface StatusActionsProps {
  order: KitchenOrder;
}

export const StatusActions = memo(function StatusActions({ order }: StatusActionsProps) {
  const { mutate, isPending, variables } = useKitchenStatusMutation();
  const { captureSnapshot } = useKitchenUndo();

  const nextStatuses = ORDER_STATUS_FLOW[order.status];
  const primaryNext = nextStatuses?.[0] as OrderStatus | undefined;
  const primaryLabel = STATUS_ACTION_LABELS[order.status];

  const isPrimaryPending =
    isPending &&
    variables?.orderId === order.id &&
    variables?.status === primaryNext;
  const isCancelPending =
    isPending &&
    variables?.orderId === order.id &&
    variables?.status === "CANCELLED";

  // useCallback prevents new function references on every render
  const handlePrimary = useCallback(() => {
    if (!primaryNext) return;
    captureSnapshot(`#${order.orderNumber} → ${primaryNext}`);
    mutate({ orderId: order.id, status: primaryNext });
  }, [order.id, order.orderNumber, primaryNext, captureSnapshot, mutate]);

  const handleCancel = useCallback(() => {
    captureSnapshot(`#${order.orderNumber} → CANCELLED`);
    mutate({ orderId: order.id, status: "CANCELLED" });
  }, [order.id, order.orderNumber, captureSnapshot, mutate]);

  if (!nextStatuses || nextStatuses.length === 0) return null;

  return (
    <div className="flex gap-2 pt-3 mt-2 border-t border-white/[0.06]">
      {primaryLabel && (
        <button
          disabled={isPending}
          onClick={handlePrimary}
          className={cn(
            "flex-1 touch-target flex items-center justify-center gap-2",
            "rounded-xl text-sm font-bold tracking-wide uppercase",
            "transition-all duration-150 ease-out active:scale-[0.96] active:duration-75",
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

      {order.status === "NEW" && (
        <button
          disabled={isPending}
          onClick={handleCancel}
          className={cn(
            "touch-target flex items-center justify-center px-4",
            "rounded-xl text-sm font-semibold",
            "bg-[#D18B8B]/10 hover:bg-[#D18B8B]/16 active:bg-[#D18B8B]/22 active:scale-[0.96] active:duration-75",
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
});
