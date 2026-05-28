import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useEffect, useRef } from "react";
import { QUERY_KEYS, SOCKET_EVENTS, SOCKET_ROOMS } from "@/lib/constants";
import { getSocket } from "@/lib/sockets";
import type {
  CreateOrderPayload,
  OrderResponse,
  OrderStatus,
  OrderStatusChangedPayload,
} from "@/types";

export type {
  CreateOrderPayload,
  OrderItem,
  OrderResponse,
  OrderStatus,
  OrderType,
} from "@/types";

/**
 * Submit a new order for a given restaurant slug.
 *
 * @param slug - The restaurant's URL slug from the dynamic route.
 */
export function useCreateOrder(slug: string) {
  return useMutation({
    mutationFn: async (payload: CreateOrderPayload) => {
      const response = await api.post<{ data: OrderResponse }>(
        `/orders/${slug}`,
        payload
      );
      return response.data.data;
    },
  });
}

/**
 * Poll + live-track a specific order by its ID.
 * Subscribes to the order's socket room and updates the cache on status changes.
 *
 * FIX: Added join callback for error logging, ref to track pending join so we
 * don't double-join if the socket was already connected, and a cleanup of the
 * once('connect') listener to prevent it firing after unmount.
 */
export function useOrderTracking(orderId: string | null) {
  const queryClient = useQueryClient();
  // Track whether we have a pending once('connect') listener so we can remove
  // it on cleanup without accidentally removing a listener added by another
  // useOrderTracking instance.
  const pendingJoinRef = useRef<(() => void) | null>(null);

  const query = useQuery({
    queryKey: orderId ? QUERY_KEYS.order(orderId) : ["order", null],
    queryFn: async () => {
      if (!orderId) return null;
      const response = await api.get<{ data: OrderResponse }>(
        `/orders/${orderId}/track`
      );
      return response.data.data;
    },
    enabled: !!orderId,
  });

  useEffect(() => {
    if (!orderId) return;

    const socket = getSocket();
    const room = SOCKET_ROOMS.order(orderId);

    // FIX: Added acknowledgement callback so join failures surface as console
    // warnings rather than silently dropping the subscription.
    const joinOrder = () => {
      socket.emit(
        SOCKET_EVENTS.JOIN_ROOM,
        room,
        (err: { code: string; message: string } | null) => {
          if (err) {
            console.warn("[socket] Failed to join order room", { room, err });
          }
          // Clear the pending join ref once we've joined (or failed).
          pendingJoinRef.current = null;
        }
      );
    };

    const handleStatusChanged = (
      data: OrderStatusChangedPayload | { orderId: string; status: OrderStatus }
    ) => {
      if (data.orderId !== orderId) return;
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.order(orderId) });
      queryClient.setQueryData<OrderResponse | null>(
        QUERY_KEYS.order(orderId),
        (oldData) => {
          if (!oldData) return oldData;
          return { ...oldData, status: data.status };
        }
      );
    };

    const handleOrderReady = (data: { orderId: string }) => {
      if (data.orderId !== orderId) return;
      handleStatusChanged({ orderId, status: "READY" });
    };

    socket.on(SOCKET_EVENTS.ORDER_STATUS_CHANGED, handleStatusChanged);
    socket.on(SOCKET_EVENTS.KITCHEN_ORDER_READY, handleOrderReady);

    if (socket.connected) {
      // Already connected — join immediately, no listener needed.
      joinOrder();
    } else {
      // FIX: Use a named function stored in a ref so we can surgically remove
      // it on cleanup. Previously, socket.on("connect", joinOrder) was used
      // but the same joinOrder reference was also registered with socket.on
      // each render cycle, meaning every re-render stacked another listener.
      const onConnect = () => {
        pendingJoinRef.current = null;
        joinOrder();
      };
      pendingJoinRef.current = onConnect;
      socket.once("connect", onConnect);
      socket.connect();
    }

    return () => {
      // Remove status event listeners unconditionally.
      socket.off(SOCKET_EVENTS.ORDER_STATUS_CHANGED, handleStatusChanged);
      socket.off(SOCKET_EVENTS.KITCHEN_ORDER_READY, handleOrderReady);

      // FIX: If we registered a once('connect') listener that hasn't fired yet
      // (component unmounted before socket connected), remove it now to prevent
      // it firing after the component is gone and emitting a join for a stale room.
      if (pendingJoinRef.current) {
        socket.off("connect", pendingJoinRef.current);
        pendingJoinRef.current = null;
      }

      socket.emit(SOCKET_EVENTS.LEAVE_ROOM, room);
    };
  }, [orderId, queryClient]);

  return query;
}
