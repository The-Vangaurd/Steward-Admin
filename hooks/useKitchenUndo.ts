"use client";

import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KITCHEN_ORDERS_QUERY_KEY } from "@/hooks/useKitchenOrders";
import type { KitchenOrder, OrderStatus } from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_UNDO_STATES = 3;

/**
 * Valid reverse transitions for the kitchen undo flow.
 *
 * The backend state machine defines FORWARD transitions:
 *   NEW → PREPARING → READY → COMPLETED
 *                           → CANCELLED (from any active state)
 *
 * Undo supports reversing the last kitchen action. We only allow one step back
 * and only for states that are meaningfully reversible in a kitchen context.
 * COMPLETED and CANCELLED are terminal — they cannot be undone via the UI.
 *
 * Allowed reverse map:  current → previous
 */
const REVERSE_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  PREPARING: "NEW",
  READY: "PREPARING",
  // COMPLETED → not reversible (order has left the kitchen)
  // CANCELLED → not reversible (requires admin decision)
  // NEW       → no previous state
};

/**
 * Returns true if an order's current status can be reversed by undo.
 * Terminal states (DELIVERED, CANCELLED) and the initial state (PENDING)
 * intentionally return false — the undo button should be hidden for them.
 */
export function canReverseStatus(status: OrderStatus): boolean {
  return status in REVERSE_TRANSITIONS;
}

/**
 * Returns the previous status for a given current status, or null if not reversible.
 */
export function getPreviousStatus(status: OrderStatus): OrderStatus | null {
  return REVERSE_TRANSITIONS[status] ?? null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UndoSnapshot {
  id: string;
  timestamp: string;
  label: string;
  /**
   * The complete kitchen queue state at the time captureSnapshot() was called.
   * This is an in-memory optimistic snapshot — it is NOT persisted.
   *
   * LIMITATION: If the browser is refreshed between captureSnapshot() and undo(),
   * the history stack is lost and undo() will become unavailable. The next
   * refetch from the server will show the correct (post-action) state.
   * To provide persistent undo, store snapshots in sessionStorage or implement
   * a server-side "reverse status" endpoint backed by orderStatusHistory.
   */
  orders: KitchenOrder[];
}

export interface UseKitchenUndoReturn {
  historyStack: UndoSnapshot[];
  canUndo: boolean;
  /** Call before any destructive action to capture the current queue state */
  captureSnapshot: (label: string) => void;
  /** Restore the most recent snapshot, with state-machine validation */
  undo: (onApiUndo?: (orderId: string, targetStatus: OrderStatus) => Promise<void>) => void;
  clearHistory: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useKitchenUndo
 *
 * Provides a max-3 undo stack for destructive kitchen queue actions.
 * Snapshots the current React Query cache state before a mutation and restores
 * it on undo (optimistic restoration).
 *
 * State-machine aware: each order in the snapshot is validated against
 * REVERSE_TRANSITIONS before cache restoration, so invalid reverse transitions
 * cannot sneak through even if the snapshot is stale.
 *
 * Resilience on browser refresh: snapshots live in React state (in-memory).
 * After a refresh the stack is empty and `canUndo` is false. The server state
 * will be fetched fresh. To add persistence, serialize `historyStack`
 */
import { useEffect } from "react";

let globalHistoryStack: UndoSnapshot[] = [];
const subscribers = new Set<(stack: UndoSnapshot[]) => void>();

export function useKitchenUndo(): UseKitchenUndoReturn {
  const queryClient = useQueryClient();
  const [historyStack, setHistoryStack] = useState<UndoSnapshot[]>(globalHistoryStack);
  const counterRef = useRef(0);

  useEffect(() => {
    const onChange = (newStack: UndoSnapshot[]) => {
      setHistoryStack(newStack);
    };
    subscribers.add(onChange);
    return () => {
      subscribers.delete(onChange);
    };
  }, []);

  const updateStack = (newStack: UndoSnapshot[]) => {
    globalHistoryStack = newStack;
    subscribers.forEach((sub) => sub(newStack));
  };

  /**
   * Capture current kitchen queue state before a destructive action.
   * Keeps only the last MAX_UNDO_STATES snapshots (oldest dropped first).
   */
  const captureSnapshot = useCallback(
    (label: string) => {
      const currentOrders =
        queryClient.getQueryData<KitchenOrder[]>(KITCHEN_ORDERS_QUERY_KEY) ?? [];

      const snapshot: UndoSnapshot = {
        id: `undo_${Date.now()}_${counterRef.current++}`,
        timestamp: new Date().toISOString(),
        label,
        // Deep-copy so subsequent mutations to the cache don't affect the snapshot
        orders: JSON.parse(JSON.stringify(currentOrders)) as KitchenOrder[],
      };

      updateStack([snapshot, ...globalHistoryStack].slice(0, MAX_UNDO_STATES));
    },
    [queryClient],
  );

  /**
   * Restore the most recent snapshot.
   *
   * Two-phase approach:
   *   1. Optimistic: immediately update React Query cache so the UI responds fast.
   *   2. Optional API call: if `onApiUndo` is provided, call it for each changed
   *      order so the backend state is also reverted. Without this, the server
   *      retains the new status and the next refetch will overwrite the undo.
   *
   * State-machine guard: orders whose current live status cannot be reversed
   * (DELIVERED, CANCELLED) are skipped — we never try to undo terminal states.
   *
   * @param onApiUndo - optional async callback called with (orderId, targetStatus)
   *   for each order whose status is being reverted. If it throws, the cache is
   *   re-invalidated immediately so the UI stays consistent with the server.
   */
  const undo = useCallback(
    (onApiUndo?: (orderId: string, targetStatus: OrderStatus) => Promise<void>) => {
      if (globalHistoryStack.length === 0) return;

      const [latest, ...rest] = globalHistoryStack;

      // ── Get the current live state from cache ──────────────────────────────
      const liveOrders =
        queryClient.getQueryData<KitchenOrder[]>(KITCHEN_ORDERS_QUERY_KEY) ?? [];
      const liveMap = new Map(liveOrders.map((o) => [o.id, o]));

      // ── Validate each order in the snapshot ──────────────────────────────
      // Build a filtered snapshot: only include orders where the status
      // actually changed AND the reverse transition is valid.
      const validatedOrders = latest.orders.map((snapshotOrder) => {
        const liveOrder = liveMap.get(snapshotOrder.id);
        if (!liveOrder) {
          // Order no longer in active queue (e.g. delivered and removed) —
          // skip state restoration for this order to avoid ghost entries.
          return liveOrder ?? snapshotOrder;
        }

        const liveStatus = liveOrder.status;
        const snapshotStatus = snapshotOrder.status;

        if (liveStatus === snapshotStatus) {
          // No change — nothing to undo for this order
          return liveOrder;
        }

        // Guard: can the live status be reversed at all?
        if (!canReverseStatus(liveStatus)) {
          // e.g. someone marked DELIVERED between captureSnapshot and undo —
          // do NOT try to undo this order; log for observability.
          console.warn(
            `[useKitchenUndo] Skipping irreversible status for order ${snapshotOrder.id}: ` +
            `live=${liveStatus}, snapshot=${snapshotStatus}`,
          );
          return liveOrder; // keep live state for this order
        }

        // Guard: the snapshot status must be a valid reverse of the live status
        const expectedPrevious = getPreviousStatus(liveStatus);
        if (expectedPrevious !== snapshotStatus) {
          console.warn(
            `[useKitchenUndo] Snapshot status mismatch for order ${snapshotOrder.id}: ` +
            `live=${liveStatus}, snapshot=${snapshotStatus}, expected-reverse=${expectedPrevious}. ` +
            `Skipping to prevent invalid state.`,
          );
          return liveOrder;
        }

        // Valid reverse — restore snapshot status
        return { ...liveOrder, status: snapshotStatus };
      });

      // ── Optimistic cache update ────────────────────────────────────────────
      queryClient.setQueryData<KitchenOrder[]>(KITCHEN_ORDERS_QUERY_KEY, validatedOrders);

      toast.success(`Undone: ${latest.label}`, {
        description: "Queue restored to previous state",
      });

      // ── Optional: persist undo to backend ─────────────────────────────────
      if (onApiUndo) {
        const apiCalls = validatedOrders
          .filter((o) => {
            const liveOrder = liveMap.get(o.id);
            return liveOrder && liveOrder.status !== o.status;
          })
          .map((o) => onApiUndo(o.id, o.status));

        Promise.all(apiCalls).catch((err) => {
          console.error('[useKitchenUndo] API undo failed', err);
          // API failed — re-invalidate so UI syncs with server truth
          queryClient.invalidateQueries({ queryKey: KITCHEN_ORDERS_QUERY_KEY });
          toast.error('Undo could not be saved to server. View refreshed.');
        });
      } else {
        // No API undo: schedule a server re-sync after 5 s so the optimistic
        // state doesn't linger forever in case the server is authoritative.
        // NOTE: without onApiUndo the server still has the new (post-action)
        // status. This is intentional — the optimistic undo is UI-only unless
        // the caller provides onApiUndo with a "reverse status" API endpoint.
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: KITCHEN_ORDERS_QUERY_KEY });
        }, 5_000);
      }

      updateStack(rest);
    },
    [queryClient],
  );

  const clearHistory = useCallback(() => {
    updateStack([]);
  }, []);

  return {
    historyStack,
    canUndo: historyStack.length > 0,
    captureSnapshot,
    undo,
    clearHistory,
  };
}
