"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import type { ApiSuccess, MenuItem } from "@/types";

export const MENU_ITEMS_QUERY_KEY = ["menu-items"] as const;

export function useMenuItems() {
  return useQuery({
    queryKey: MENU_ITEMS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<MenuItem[]>>(
        "/menu/admin/items",
        { params: { limit: 200, page: 1 } }
      );
      return data.data;
    },
  });
}

export function useItemAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      input,
    }: {
      itemId: string;
      input: { isAvailable: boolean };
    }) => {
      const { data } = await api.patch<ApiSuccess<MenuItem>>(
        `/menu/admin/items/${itemId}/availability`,
        input
      );
      return data.data;
    },

    // Optimistic update.
    async onMutate({ itemId, input }) {
      await queryClient.cancelQueries({ queryKey: MENU_ITEMS_QUERY_KEY });
      const previousItems = queryClient.getQueryData<MenuItem[]>(MENU_ITEMS_QUERY_KEY);

      queryClient.setQueryData<MenuItem[]>(MENU_ITEMS_QUERY_KEY, (items) =>
        items?.map((item) =>
          item.id === itemId ? { ...item, isAvailable: input.isAvailable } : item
        )
      );

      return { previousItems };
    },

    // Replace with authoritative server response — do NOT invalidate.
    // The socket broadcasts item:availability_changed which useKitchenSocket
    // already handles with an invalidateQueries call, avoiding a double fetch.
    onSuccess(updatedItem) {
      queryClient.setQueryData<MenuItem[]>(MENU_ITEMS_QUERY_KEY, (items) =>
        items?.map((current) => (current.id === updatedItem.id ? updatedItem : current))
      );
      toast.success(
        `${updatedItem.name} marked ${updatedItem.isAvailable ? "available" : "unavailable"}`
      );
    },

    onError(error: unknown, _variables, context) {
      if (context?.previousItems) {
        queryClient.setQueryData(MENU_ITEMS_QUERY_KEY, context.previousItems);
      }
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err?.response?.data?.message ??
          (error instanceof Error ? error.message : "Could not update item")
      );
    },
  });
}
