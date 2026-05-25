"use client";

/**
 * useSocket — Admin dashboard socket subscription.
 * Joins admin:* and restaurant:* rooms; invalidates orders and menu-items.
 */

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import { useBaseSocket } from "@/hooks/useBaseSocket";

export function useSocket() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const invalidateOrders = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  }, [queryClient]);

  const handleOrderCreated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    toast.info("New order received!", { description: "Check the orders page." });
  }, [queryClient]);

  const invalidateMenuItems = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["menu-items"] });
  }, [queryClient]);

  const restaurantId = user?.restaurantId;

  useBaseSocket({
    enabled: !!restaurantId,
    rooms: restaurantId
      ? [`admin:${restaurantId}`, `restaurant:${restaurantId}`]
      : [],
    events: {
      "order:updated": invalidateOrders,
      "order:created": handleOrderCreated,
      "item:availability_changed": invalidateMenuItems,
    },
  });
}
