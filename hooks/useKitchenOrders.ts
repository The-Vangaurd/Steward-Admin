"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    // Socket events invalidate the query in real-time; poll every 30s as fallback.
    refetchInterval: 30_000,
  });
}

export function useKitchenQueuePartitions() {
  const { data: orders = [], isLoading, isError } = useKitchenOrders();

  // 1. Takeaway Orders
  const takeawayOrders = orders.filter((o) => o.orderType === "TAKEAWAY");

  // 2. Service Category Orders (Dine-in and Ready)
  const serviceCategoryOrders = orders.filter(
    (o) => o.orderType !== "TAKEAWAY" && o.status === "READY"
  );

  // Active Kitchen Orders (Dine-in, Confirmed/Preparing)
  const activeOrders = orders
    .filter(
      (o) =>
        o.orderType !== "TAKEAWAY" &&
        (o.status === "CONFIRMED" || o.status === "PREPARING")
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  // 3. General Kitchen Orders (Top 3 active)
  const generalKitchenOrders = activeOrders.slice(0, 3);

  // 4. Dosa/Grill Aggregation (TIME_TAKING items)
  // Priority = Top 3 orders. Next = rest of orders.
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

  const dosaGrillAggregation = [
    ...Array.from(priorityItems.values()),
    ...Array.from(nextItems.values()),
  ];

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
      // Map legacy/UI status names to backend OrderStatus
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

    // Optimistic update
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
