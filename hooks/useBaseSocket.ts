"use client";

/**
 * useBaseSocket — Reusable socket connection primitive.
 *
 * Both `useSocket` (admin) and `useKitchenSocket` (kitchen) are built on top
 * of this hook. It handles:
 *   • acquireSocket / releaseSocket reference counting
 *   • connect / disconnect lifecycle
 *   • room join on connect (or immediately if already connected)
 *   • settingsStore.setWsConnected tracking
 *   • arbitrary event-handler registration / cleanup
 *
 * IMPORTANT FOR CALLERS: `rooms`, `events`, `onConnected`, `onDisconnected`,
 * and `onConnectError` are intentionally excluded from the useEffect deps array
 * (suppressed with eslint-disable) to avoid reconnect loops on every render.
 * You MUST memoize any of these values with useMemo / useCallback at the
 * call site — otherwise stale closures will be used for event handlers.
 */

import { useEffect } from "react";
import { acquireSocket, releaseSocket, updateSocketAuth } from "@/lib/sockets";
import { useAuthStore } from "@/stores/auth.store";
import { settingsStore } from "@/stores/settings.store";

export type SocketEventMap = Record<string, (...args: unknown[]) => void>;

interface UseBaseSocketOptions {
  rooms: string[];
  events?: SocketEventMap;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onConnectError?: (err: Error) => void;
  /** Set to false to skip connecting (e.g. waiting on auth or on non-kitchen pages). Default: true */
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
    updateSocketAuth(accessToken);

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
      settingsStore.setWsConnected(false);
      onConnectError?.(err);

      if (err.message === "TOKEN_EXPIRED") {
        // Pull the latest in-memory token (may have been refreshed by the
        // axios interceptor since the last socket handshake) and reconnect.
        setTimeout(() => {
          const freshToken = useAuthStore.getState().accessToken;
          if (freshToken) updateSocketAuth(freshToken);
          socket.connect();
        }, 2000);
      }
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
