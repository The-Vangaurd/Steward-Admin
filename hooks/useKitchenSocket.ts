"use client";

/**
 * useKitchenSocket — Kitchen-specific socket subscription.
 * Joins kitchen:* room; plays sound on new orders, patches cache on updates.
 *
 * Accepts an `enabled` prop so the dashboard layout can gate this hook to
 * kitchen-related pages only, avoiding unnecessary socket room subscriptions
 * on staff, menu, settings, and orders pages.
 *
 * OPTIMIZATION: On "order:updated" events, we attempt a targeted cache patch
 * before falling back to full invalidation. This prevents the full list from
 * re-rendering when a single order changes.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { useBaseSocket } from "@/hooks/useBaseSocket";
import { KITCHEN_ORDERS_QUERY_KEY } from "@/hooks/useKitchenOrders";
import { MENU_ITEMS_QUERY_KEY } from "@/hooks/useItemAvailability";
import { playNewOrderSound } from "@/lib/sound";
import type { KitchenOrder } from "@/types";

interface UseKitchenSocketOptions {
  /** Set to false to skip subscribing (e.g. non-kitchen pages). Default: true */
  enabled?: boolean;
}

export function useKitchenSocket({ enabled = true }: UseKitchenSocketOptions = {}) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const invalidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleInvalidate = useCallback(() => {
    if (invalidateTimerRef.current) return;
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
            // Only invalidate if it's a non-terminal status, meaning a new active order was moved
            if (updated.status !== "COMPLETED" && updated.status !== "CANCELLED") {
              scheduleInvalidate();
            }
            return current;
          }

          // If the order has transitioned to COMPLETED or CANCELLED, remove it from active queue
          if (updated.status === "COMPLETED" || updated.status === "CANCELLED") {
            return current.filter((o) => o.id !== updated.id);
          }

          const next = [...current];
          next[idx] = updated;
          return next;
        }
      );
    } else {
      scheduleInvalidate();
    }
  }, [queryClient, scheduleInvalidate]);

  const restaurantId = user?.restaurantId;

  // FIX: Memoize the events map so useBaseSocket's stale-closure capture
  // always holds the latest handler references. Without this, a parent
  // re-render that causes useKitchenSocket to re-render silently uses the
  // stale handlers captured at effect-mount time.
  const events = useMemo(() => ({
    "kitchen:new_order": handleNewOrder,
    "order:updated": handleOrderUpdated,
    "item:availability_changed": invalidateMenuItems,
  }), [handleNewOrder, handleOrderUpdated, invalidateMenuItems]);

  // FIX: Memoize the rooms array so it has a stable reference across renders.
  // A new array literal on every render would not cause a reconnect (rooms is
  // excluded from deps in useBaseSocket), but it avoids unnecessary allocations.
  const rooms = useMemo(
    () => (restaurantId ? [`kitchen:${restaurantId}`] : []),
    [restaurantId]
  );

  useBaseSocket({
    enabled: enabled && !!restaurantId,
    rooms,
    events,
  });

  // Clear any pending debounce timer on unmount so we don't trigger a query
  // invalidation against an already-torn-down component tree.
  useEffect(() => {
    return () => {
      if (invalidateTimerRef.current) {
        clearTimeout(invalidateTimerRef.current);
        invalidateTimerRef.current = null;
      }
    };
  }, []);
}
