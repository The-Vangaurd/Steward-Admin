"use client";

/**
 * useBaseSocket — Reusable socket connection primitive.
 *
 * Both `useSocket` (admin) and `useKitchenSocket` (kitchen) are built on top
 * of this hook.  It handles:
 *   • acquireSocket / releaseSocket reference counting
 *   • connect / disconnect lifecycle
 *   • room join on connect (or immediately if already connected)
 *   • settingsStore.setWsConnected tracking
 *   • arbitrary event-handler registration / cleanup
 *
 * Usage:
 *   useBaseSocket({
 *     rooms: ["admin:abc", "restaurant:abc"],
 *     events: {
 *       "order:created": () => queryClient.invalidateQueries(…),
 *     },
 *   });
 */

import { useEffect } from "react";
import { acquireSocket, releaseSocket, updateSocketAuth } from "@/lib/sockets";
import { useAuthStore } from "@/stores/auth.store";
import { settingsStore } from "@/stores/settings.store";

export type SocketEventMap = Record<string, (...args: unknown[]) => void>;

interface UseBaseSocketOptions {
  /** Rooms to join on connect (emits `join_room` for each). */
  rooms: string[];
  /** Event → handler mapping. Handlers are bound and cleaned up automatically. */
  events?: SocketEventMap;
  /** Called when connection is established (after rooms joined). */
  onConnected?: () => void;
  /** Called on disconnect. */
  onDisconnected?: () => void;
  /** Called on connect_error. */
  onConnectError?: (err: Error) => void;
  /** Set to false to skip connecting (e.g. waiting on auth). Default: true */
  enabled?: boolean;
}

export function useBaseSocket({
  rooms,
  events = {},
  onConnected,
  onDisconnected,
  onConnectError,
  enabled = true,
}: UseBaseSocketOptions) {
  const { accessToken, user } = useAuthStore();

  useEffect(() => {
    if (!enabled || !accessToken || !user?.restaurantId) return;

    const socket = acquireSocket(accessToken);
    updateSocketAuth(accessToken);   // ensure auth is current before connect

    const handleConnect = () => {
      for (const room of rooms) {
        socket.emit("join_room", room, (err: { code: string; message: string } | null) => {
          if (err) console.error("[socket] failed to join room", { room, err });
        });
      }
      settingsStore.setWsConnected(true);
      onConnected?.();
    };

    const handleDisconnect = () => {
      settingsStore.setWsConnected(false);
      onDisconnected?.();
    };

    const handleConnectError = (err: Error) => {
      console.error("[socket] connect_error", err.message);
      if (err.message === 'TOKEN_EXPIRED') {
        // The axios interceptor will refresh on the next API call.
        // Reconnect after a short delay to pick up the new token.
        setTimeout(() => { socket.connect(); }, 2000);
      }
      settingsStore.setWsConnected(false);
      onConnectError?.(err);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    for (const [event, handler] of Object.entries(events)) {
      socket.on(event, handler);
    }

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);

      for (const [event, handler] of Object.entries(events)) {
        socket.off(event, handler);
      }

      for (const room of rooms) {
        socket.emit("leave_room", room);
      }

      settingsStore.setWsConnected(false);
      releaseSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, user?.restaurantId, enabled]);
}
