"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { acquireSocket, releaseSocket } from "@/lib/sockets";
import { useAuthStore } from "@/stores/auth.store";
import { settingsStore } from "@/stores/settings.store";

export function useSocket() {
  const { accessToken, user } = useAuthStore();
  const queryClient = useQueryClient();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!accessToken || !user?.restaurantId || connectedRef.current) return;

    const socket = acquireSocket(accessToken);
    connectedRef.current = true;

    const joinRooms = () => {
      socket.emit("join_room", `admin:${user.restaurantId}`);
      socket.emit("join_room", `restaurant:${user.restaurantId}`);
      settingsStore.setWsConnected(true);
    };

    const handleDisconnect = () => {
      settingsStore.setWsConnected(false);
    };

    const handleOrderUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    };

    const handleOrderCreated = () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.info("New order received!", { description: "Check the orders page." });
    };

    const handleAvailabilityChanged = () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    };

    socket.on("connect", joinRooms);
    socket.on("disconnect", handleDisconnect);
    socket.on("order:updated", handleOrderUpdated);
    socket.on("order:created", handleOrderCreated);
    socket.on("item:availability_changed", handleAvailabilityChanged);

    if (!socket.connected) {
      socket.connect();
    } else {
      joinRooms();
    }

    return () => {
      socket.off("connect", joinRooms);
      socket.off("disconnect", handleDisconnect);
      socket.off("order:updated", handleOrderUpdated);
      socket.off("order:created", handleOrderCreated);
      socket.off("item:availability_changed", handleAvailabilityChanged);
      connectedRef.current = false;
      settingsStore.setWsConnected(false);
      releaseSocket();
    };
  }, [accessToken, user?.restaurantId, queryClient]);
}
