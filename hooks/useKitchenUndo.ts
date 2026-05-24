"use client";

import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KITCHEN_ORDERS_QUERY_KEY } from "@/hooks/useKitchenOrders";
import type { KitchenOrder } from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_UNDO_STATES = 3;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UndoSnapshot {
    id: string;
    timestamp: string;
    label: string;
    orders: KitchenOrder[];
}

export interface UseKitchenUndoReturn {
    historyStack: UndoSnapshot[];
    canUndo: boolean;
    /** Call before any destructive action to capture the current queue state */
    captureSnapshot: (label: string) => void;
    /** Restore the most recent snapshot */
    undo: () => void;
    clearHistory: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useKitchenUndo
 *
 * Provides a max-3 undo stack for destructive kitchen queue actions.
 * Snapshots the current React Query cache state before a mutation and
 * restores it on undo.
 *
 * Usage:
 *   const { captureSnapshot, undo, historyStack } = useKitchenUndo();
 *
 *   // Before marking served:
 *   captureSnapshot("Served #1042");
 *   await markAsServedMutation.mutateAsync(...);
 */
export function useKitchenUndo(): UseKitchenUndoReturn {
    const queryClient = useQueryClient();
    const [historyStack, setHistoryStack] = useState<UndoSnapshot[]>([]);
    // Use a ref for counter to avoid re-renders
    const counterRef = useRef(0);

    /**
     * Capture current kitchen queue state before a destructive action.
     * Keeps only the last MAX_UNDO_STATES snapshots.
     */
    const captureSnapshot = useCallback(
        (label: string) => {
            const currentOrders =
                queryClient.getQueryData<KitchenOrder[]>(KITCHEN_ORDERS_QUERY_KEY) ?? [];

            const snapshot: UndoSnapshot = {
                id: `undo_${Date.now()}_${counterRef.current++}`,
                timestamp: new Date().toISOString(),
                label,
                orders: currentOrders,
            };

            setHistoryStack((prev) => {
                const next = [snapshot, ...prev];
                return next.slice(0, MAX_UNDO_STATES);
            });
        },
        [queryClient]
    );

    /**
     * Restore the most recent snapshot.
     * This updates the React Query cache directly (optimistic restoration).
     * A hard refetch follows after a short delay so the server state wins if
     * the user doesn't interact further.
     */
    const undo = useCallback(() => {
        setHistoryStack((prev) => {
            if (prev.length === 0) return prev;

            const [latest, ...rest] = prev;

            // Restore the snapshot to the query cache
            queryClient.setQueryData<KitchenOrder[]>(
                KITCHEN_ORDERS_QUERY_KEY,
                latest.orders
            );

            toast.success(`Undone: ${latest.label}`, {
                description: "Queue restored to previous state",
            });

            // After 5 s, re-sync with server to avoid stale state
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: KITCHEN_ORDERS_QUERY_KEY });
            }, 5_000);

            return rest;
        });
    }, [queryClient]);

    const clearHistory = useCallback(() => {
        setHistoryStack([]);
    }, []);

    return {
        historyStack,
        canUndo: historyStack.length > 0,
        captureSnapshot,
        undo,
        clearHistory,
    };
}
