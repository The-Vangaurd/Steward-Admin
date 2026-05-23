"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { acquireSocket, releaseSocket } from "@/lib/sockets";
import { useAuthStore } from "@/stores/auth.store";
import { settingsStore } from "@/stores/settings.store";
import { KITCHEN_ORDERS_QUERY_KEY } from "@/hooks/useKitchenOrders";
import { MENU_ITEMS_QUERY_KEY } from "@/hooks/useItemAvailability";
import { playNewOrderSound } from "@/lib/sound";

export function useKitchenSocket() {
  const { accessToken, user } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken || !user?.restaurantId) return;

    const currentSocket = acquireSocket(accessToken);
    const room = `kitchen:${user.restaurantId}`;

    const invalidateKitchenOrders = () => {
      queryClient.invalidateQueries({ queryKey: KITCHEN_ORDERS_QUERY_KEY });
    };

    const invalidateMenuItems = () => {
      queryClient.invalidateQueries({ queryKey: MENU_ITEMS_QUERY_KEY });
    };

    const joinKitchenRoom = () => {
      currentSocket.emit(
        "join_room",
        room,
        (error: { code: string; message: string } | null) => {
          if (error) {
            console.error("[socket] failed to join kitchen room", { room, error });
          }
        }
      );
      settingsStore.setWsConnected(true);
    };

    const handleDisconnect = () => {
      settingsStore.setWsConnected(false);
    };

    const handleNewOrder = () => {
      invalidateKitchenOrders();
      playNewOrderSound();
    };

    const handleConnectError = (error: Error) => {
      console.error("[socket] kitchen connection failed", error.message);
      settingsStore.setWsConnected(false);
    };

    currentSocket.on("connect", joinKitchenRoom);
    currentSocket.on("disconnect", handleDisconnect);
    currentSocket.on("connect_error", handleConnectError);
    currentSocket.on("kitchen:new_order", handleNewOrder);
    currentSocket.on("order:updated", invalidateKitchenOrders);
    currentSocket.on("item:availability_changed", invalidateMenuItems);

    if (!currentSocket.connected) {
      currentSocket.connect();
    } else {
      joinKitchenRoom();
    }

    return () => {
      currentSocket.off("connect", joinKitchenRoom);
      currentSocket.off("disconnect", handleDisconnect);
      currentSocket.off("connect_error", handleConnectError);
      currentSocket.off("kitchen:new_order", handleNewOrder);
      currentSocket.off("order:updated", invalidateKitchenOrders);
      currentSocket.off("item:availability_changed", invalidateMenuItems);
      currentSocket.emit("leave_room", room);
      settingsStore.setWsConnected(false);
      releaseSocket();
    };
  }, [accessToken, user?.restaurantId, queryClient]);
}
