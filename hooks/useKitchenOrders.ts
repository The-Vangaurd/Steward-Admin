"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import type { ApiSuccess, KitchenOrder, OrderStatus } from "@/types";

export const KITCHEN_ORDERS_QUERY_KEY = ["kitchen-orders"] as const;

export interface DosaGrillAggregatedItem {
  name: string;
  totalQuantity: number;
  isPriority: boolean;
}

// ── Shared status resolver ────────────────────────────────────────────────────
// Previously duplicated identically in mutationFn and onMutate.
function resolveOrderStatus(
  kitchenStatus?: string,
  input?: { status: OrderStatus }
): OrderStatus {
  if (input?.status) return input.status;
  if (kitchenStatus === "READY_TO_SERVE") return "READY";
  if (kitchenStatus === "SERVED") return "DELIVERED";
  return kitchenStatus as OrderStatus;
}

export function useKitchenOrders() {
  return useQuery({
    queryKey: KITCHEN_ORDERS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<KitchenOrder[]>>(
        "/orders/kitchen/queue"
      );
      return data.data;
    },
    // Socket events invalidate in real-time; 30s poll as fallback
    refetchInterval: 30_000,
    structuralSharing: true,
  });
}

export function useKitchenQueuePartitions() {
  const { data: orders = [], isLoading, isError } = useKitchenOrders();

  const takeawayOrders = useMemo(
    () => orders.filter((o) => o.orderType === "TAKEAWAY"),
    [orders]
  );

  const serviceCategoryOrders = useMemo(
    () => orders.filter((o) => o.orderType !== "TAKEAWAY" && o.status === "READY"),
    [orders]
  );

  const activeOrders = useMemo(
    () =>
      orders
        .filter(
          (o) =>
            o.orderType !== "TAKEAWAY" &&
            (o.status === "CONFIRMED" || o.status === "PREPARING")
        )
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
    [orders]
  );

  const generalKitchenOrders = useMemo(
    () => activeOrders.slice(0, 3),
    [activeOrders]
  );

  const dosaGrillAggregation = useMemo(() => {
    const priorityItems = new Map<string, DosaGrillAggregatedItem>();
    const nextItems     = new Map<string, DosaGrillAggregatedItem>();

    activeOrders.forEach((order, index) => {
      const isPriority = index < 3;
      const targetMap  = isPriority ? priorityItems : nextItems;

      order.items.forEach((item) => {
        if (item.menuItem?.kitchenType === "TIME_TAKING") {
          const existing = targetMap.get(item.name);
          if (existing) {
            existing.totalQuantity += item.quantity;
          } else {
            targetMap.set(item.name, {
              name: item.name,
              totalQuantity: item.quantity,
              isPriority,
            });
          }
        }
      });
    });

    return [
      ...Array.from(priorityItems.values()),
      ...Array.from(nextItems.values()),
    ];
  }, [activeOrders]);

  return {
    generalKitchenOrders,
    serviceCategoryOrders,
    takeawayOrders,
    dosaGrillAggregation,
    isLoading,
    isError,
  };
}

export function useKitchenStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      kitchenStatus,
      input,
    }: {
      orderId: string;
      kitchenStatus?: string;
      input?: { status: OrderStatus };
    }) => {
      const status = resolveOrderStatus(kitchenStatus, input);
      const { data } = await api.patch<ApiSuccess<KitchenOrder>>(
        `/orders/kitchen/${orderId}/status`,
        { status }
      );
      return data.data;
    },

    async onMutate({ orderId, kitchenStatus, input }) {
      await queryClient.cancelQueries({ queryKey: KITCHEN_ORDERS_QUERY_KEY });
      const previousOrders = queryClient.getQueryData<KitchenOrder[]>(
        KITCHEN_ORDERS_QUERY_KEY
      );

      const optimisticStatus = resolveOrderStatus(kitchenStatus, input);

      queryClient.setQueryData<KitchenOrder[]>(KITCHEN_ORDERS_QUERY_KEY, (orders) =>
        orders?.map((order) =>
          order.id === orderId ? { ...order, status: optimisticStatus } : order
        )
      );

      return { previousOrders };
    },

    onSuccess(updatedOrder) {
      queryClient.setQueryData<KitchenOrder[]>(KITCHEN_ORDERS_QUERY_KEY, (orders) =>
        orders?.map((current) =>
          current.id === updatedOrder.id ? updatedOrder : current
        )
      );
      toast.success(
        `#${updatedOrder.orderNumber} → ${updatedOrder.status.toLowerCase()}`
      );
    },

    onError(error: unknown, _variables, context) {
      if (context?.previousOrders) {
        queryClient.setQueryData(KITCHEN_ORDERS_QUERY_KEY, context.previousOrders);
      }
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err?.response?.data?.message ??
          (error instanceof Error ? error.message : "Could not update order")
      );
    },
  });
}
