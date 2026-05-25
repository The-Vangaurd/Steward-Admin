"use client";

/**
 * useKitchenSocket — Kitchen-specific socket subscription.
 * Joins kitchen:* room; plays sound on new orders, invalidates kitchen queue.
 */

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { useBaseSocket } from "@/hooks/useBaseSocket";
import { KITCHEN_ORDERS_QUERY_KEY } from "@/hooks/useKitchenOrders";
import { MENU_ITEMS_QUERY_KEY } from "@/hooks/useItemAvailability";
import { playNewOrderSound } from "@/lib/sound";

export function useKitchenSocket() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const invalidateKitchenOrders = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: KITCHEN_ORDERS_QUERY_KEY });
  }, [queryClient]);

  const invalidateMenuItems = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: MENU_ITEMS_QUERY_KEY });
  }, [queryClient]);

  const handleNewOrder = useCallback(() => {
    invalidateKitchenOrders();
    playNewOrderSound();
  }, [invalidateKitchenOrders]);

  const restaurantId = user?.restaurantId;

  useBaseSocket({
    enabled: !!restaurantId,
    rooms: restaurantId ? [`kitchen:${restaurantId}`] : [],
    events: {
      "kitchen:new_order": handleNewOrder,
      "order:updated": invalidateKitchenOrders,
      "item:availability_changed": invalidateMenuItems,
    },
  });
}
