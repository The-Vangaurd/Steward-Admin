"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import type { ApiSuccess, KitchenOrder, OrderStatus } from "@/types";

import { settingsStore } from "@/stores/settings.store";

export const KITCHEN_ORDERS_QUERY_KEY = ["kitchen-orders"] as const;

export function useKitchenOrders() {
  return useQuery({
    queryKey: KITCHEN_ORDERS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<KitchenOrder[]>>(
        "/orders/kitchen/queue"
      );
      return data.data;
    },
    // Socket events invalidate in real-time; only poll when offline
    refetchInterval: () => {
      const { wsConnected } = settingsStore.getSnapshot();
      return wsConnected ? false : 15_000;
    },
    structuralSharing: true,
  });
}

/** Partition active orders into the three kanban columns */
export function useKanbanColumns() {
  const { data: orders = [], isLoading, isError } = useKitchenOrders();

  const byTime = useCallback(
    (a: KitchenOrder, b: KitchenOrder) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    []
  );

  const newOrders = useMemo(
    () =>
      orders
        .filter((o) => o.status === "NEW")
        .sort(byTime),
    [orders, byTime]
  );

  const preparingOrders = useMemo(
    () =>
      orders
        .filter((o) => o.status === "PREPARING")
        .sort(byTime),
    [orders, byTime]
  );

  const readyOrders = useMemo(
    () =>
      orders
        .filter((o) => o.status === "READY")
        .sort(byTime),
    [orders, byTime]
  );

  return { newOrders, preparingOrders, readyOrders, isLoading, isError };
}

export function useKitchenStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: OrderStatus;
    }) => {
      const { data } = await api.patch<ApiSuccess<KitchenOrder>>(
        `/orders/kitchen/${orderId}/status`,
        { status }
      );
      return data.data;
    },

    // ── Optimistic update: move card instantly ────────────────────────────
    async onMutate({ orderId, status }) {
      await queryClient.cancelQueries({ queryKey: KITCHEN_ORDERS_QUERY_KEY });
      const previousOrders = queryClient.getQueryData<KitchenOrder[]>(
        KITCHEN_ORDERS_QUERY_KEY
      );

      queryClient.setQueryData<KitchenOrder[]>(
        KITCHEN_ORDERS_QUERY_KEY,
        (orders) => {
          if (!orders) return orders;
          // COMPLETED orders disappear from the board immediately
          if (status === "COMPLETED") {
            return orders.filter((o) => o.id !== orderId);
          }
          return orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status,
                  // Stamp startedPreparingAt locally so the timer starts immediately
                  ...(status === "PREPARING" && !order.startedPreparingAt
                    ? { startedPreparingAt: new Date().toISOString() }
                    : {}),
                }
              : order
          );
        }
      );

      return { previousOrders };
    },

    onSuccess(updatedOrder) {
      // For COMPLETED orders they've already been removed; for others sync
      queryClient.setQueryData<KitchenOrder[]>(
        KITCHEN_ORDERS_QUERY_KEY,
        (orders) => {
          if (!orders) return orders;
          if (updatedOrder.status === "COMPLETED") {
            return orders.filter((o) => o.id !== updatedOrder.id);
          }
          return orders.map((current) =>
            current.id === updatedOrder.id ? updatedOrder : current
          );
        }
      );
    },

    onError(error: unknown, _variables, context) {
      // Rollback on failure
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
