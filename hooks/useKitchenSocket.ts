"use client";

/**
 * useKitchenSocket — Kitchen-specific socket subscription.
 * Joins kitchen:* room; plays sound on new orders, patches cache on updates.
 * 
 * OPTIMIZATION: On "order:updated" events, we attempt a targeted cache patch
 * before falling back to full invalidation. This prevents the full list from
 * re-rendering when a single order changes.
 */

import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { useBaseSocket } from "@/hooks/useBaseSocket";
import { KITCHEN_ORDERS_QUERY_KEY } from "@/hooks/useKitchenOrders";
import { MENU_ITEMS_QUERY_KEY } from "@/hooks/useItemAvailability";
import { playNewOrderSound } from "@/lib/sound";
import type { KitchenOrder } from "@/types";

export function useKitchenSocket() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  // Debounce rapid bursts (multiple events within 300ms → single invalidation)
  const invalidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleInvalidate = useCallback(() => {
    if (invalidateTimerRef.current) return; // already queued
    invalidateTimerRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: KITCHEN_ORDERS_QUERY_KEY });
      invalidateTimerRef.current = null;
    }, 300);
  }, [queryClient]);

  const invalidateMenuItems = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: MENU_ITEMS_QUERY_KEY });
  }, [queryClient]);

  const handleNewOrder = useCallback(() => {
    scheduleInvalidate();
    playNewOrderSound();
  }, [scheduleInvalidate]);

  /**
   * Handle order update — if the socket payload includes the full updated order,
   * patch the cache directly without a network round-trip.
   * Falls back to invalidation if payload is absent or partial.
   */
  const handleOrderUpdated = useCallback((payload: unknown) => {
    if (
      payload &&
      typeof payload === "object" &&
      "id" in payload &&
      "status" in payload
    ) {
      const updated = payload as KitchenOrder;
      queryClient.setQueryData<KitchenOrder[]>(
        KITCHEN_ORDERS_QUERY_KEY,
        (current) => {
          if (!current) return current;
          const idx = current.findIndex((o) => o.id === updated.id);
          if (idx === -1) {
            // New order not in cache — full refresh needed
            scheduleInvalidate();
            return current;
          }
          // Patch in-place — stable references for all other orders
          const next = [...current];
          next[idx] = updated;
          return next;
        }
      );
    } else {
      // No payload or incomplete — fall back to debounced invalidation
      scheduleInvalidate();
    }
  }, [queryClient, scheduleInvalidate]);

  const restaurantId = user?.restaurantId;

  useBaseSocket({
    enabled: !!restaurantId,
    rooms: restaurantId ? [`kitchen:${restaurantId}`] : [],
    events: {
      "kitchen:new_order": handleNewOrder,
      "order:updated": handleOrderUpdated,
      "item:availability_changed": invalidateMenuItems,
    },
  });
}
