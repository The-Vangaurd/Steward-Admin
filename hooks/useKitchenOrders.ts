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
    // Structural sharing: React Query will reuse object references for
    // unchanged orders, preventing OrderCard from re-rendering
    structuralSharing: true,
  });
}

export function useKitchenQueuePartitions() {
  const { data: orders = [], isLoading, isError } = useKitchenOrders();

  // Each partition is memoized independently — a status change to one order
  // won't recalculate unrelated partitions
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
    const nextItems = new Map<string, DosaGrillAggregatedItem>();

    activeOrders.forEach((order, index) => {
      const isPriority = index < 3;
      const targetMap = isPriority ? priorityItems : nextItems;

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
      let status: OrderStatus = "PENDING";
      if (input?.status) {
        status = input.status;
      } else if (kitchenStatus === "READY_TO_SERVE") {
        status = "READY";
      } else if (kitchenStatus === "SERVED") {
        status = "DELIVERED";
      } else {
        status = kitchenStatus as OrderStatus;
      }

      const { data } = await api.patch<ApiSuccess<KitchenOrder>>(
        `/orders/kitchen/${orderId}/status`,
        { status }
      );
      return data.data;
    },

    // Optimistic update — patch single order in cache, not full array replace
    async onMutate({ orderId, kitchenStatus, input }) {
      await queryClient.cancelQueries({ queryKey: KITCHEN_ORDERS_QUERY_KEY });
      const previousOrders = queryClient.getQueryData<KitchenOrder[]>(
        KITCHEN_ORDERS_QUERY_KEY
      );

      let optimisticStatus: OrderStatus = "PENDING";
      if (input?.status) {
        optimisticStatus = input.status;
      } else if (kitchenStatus === "READY_TO_SERVE") {
        optimisticStatus = "READY";
      } else if (kitchenStatus === "SERVED") {
        optimisticStatus = "DELIVERED";
      } else {
        optimisticStatus = kitchenStatus as OrderStatus;
      }

      // Patch only the changed order — stable references for all others
      queryClient.setQueryData<KitchenOrder[]>(KITCHEN_ORDERS_QUERY_KEY, (orders) =>
        orders?.map((order) =>
          order.id === orderId ? { ...order, status: optimisticStatus } : order
        )
      );

      return { previousOrders };
    },

    onSuccess(updatedOrder) {
      // Patch single order on success — no full array invalidation
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
        queryClient.setQueryData(
          KITCHEN_ORDERS_QUERY_KEY,
          context.previousOrders
        );
      }
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err?.response?.data?.message ??
          (error instanceof Error ? error.message : "Could not update order")
      );
    },
  });
}

export const useOrderStatus = useKitchenStatusMutation;
