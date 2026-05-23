"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import type { ApiSuccess, KitchenOrder, OrderStatus } from "@/types";

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
    // Socket events invalidate the query in real-time; poll every 30s as fallback.
    refetchInterval: 30_000,
  });
}

export function useOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      input,
    }: {
      orderId: string;
      input: { status: OrderStatus };
    }) => {
      const { data } = await api.patch<ApiSuccess<KitchenOrder>>(
        `/orders/kitchen/${orderId}/status`,
        input
      );
      return data.data;
    },

    // Optimistic update: immediately reflect the new status in the UI.
    async onMutate({ orderId, input }) {
      await queryClient.cancelQueries({ queryKey: KITCHEN_ORDERS_QUERY_KEY });
      const previousOrders = queryClient.getQueryData<KitchenOrder[]>(
        KITCHEN_ORDERS_QUERY_KEY
      );

      queryClient.setQueryData<KitchenOrder[]>(KITCHEN_ORDERS_QUERY_KEY, (orders) =>
        orders?.map((order) =>
          order.id === orderId ? { ...order, status: input.status } : order
        )
      );

      return { previousOrders };
    },

    // Replace the optimistic entry with the authoritative server response.
    // Do NOT invalidate here — the socket will fire order:updated which already
    // calls invalidateQueries via useKitchenSocket, preventing the double fetch.
    onSuccess(updatedOrder) {
      queryClient.setQueryData<KitchenOrder[]>(KITCHEN_ORDERS_QUERY_KEY, (orders) =>
        orders?.map((current) =>
          current.id === updatedOrder.id ? updatedOrder : current
        )
      );
      toast.success(`#${updatedOrder.orderNumber} → ${updatedOrder.status.toLowerCase()}`);
    },

    // Roll back optimistic update on error.
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
