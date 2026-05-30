"use client";

/**
 * useSocket — Admin dashboard socket subscription.
 * Joins admin:* and restaurant:* rooms; invalidates orders and menu-items.
 */

import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import { useBaseSocket } from "@/hooks/useBaseSocket";

interface UseSocketOptions {
  /** Set to false to disable subscription (e.g. for non-admin roles). Default: true */
  enabled?: boolean;
}

export function useSocket({ enabled = true }: UseSocketOptions = {}) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const invalidateOrders = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  }, [queryClient]);

  const handleOrderCreated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    // Also refresh the notification bell so the badge count updates immediately
    queryClient.invalidateQueries({ queryKey: ["header-recent-orders"] });
    toast.info("New order received!", { description: "Check the orders page." });
  }, [queryClient]);

  const invalidateMenuItems = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["menu-items"] });
  }, [queryClient]);

  const restaurantId = user?.restaurantId;

  // FIX: Memoize the events map so useBaseSocket's stale-closure capture
  // always holds the latest handler references. Without this, a parent
  // re-render that causes useSocket to re-render silently uses stale handlers
  // captured at effect-mount time.
  const events = useMemo(() => ({
    "order:updated": invalidateOrders,
    "order:created": handleOrderCreated,
    "item:availability_changed": invalidateMenuItems,
  }), [invalidateOrders, handleOrderCreated, invalidateMenuItems]);

  // FIX: Memoize the rooms array for a stable reference.
  const rooms = useMemo(
    () =>
      restaurantId
        ? [`admin:${restaurantId}`, `restaurant:${restaurantId}`]
        : [],
    [restaurantId]
  );

  useBaseSocket({
    enabled: enabled && !!restaurantId,
    rooms,
    events,
  });
}
