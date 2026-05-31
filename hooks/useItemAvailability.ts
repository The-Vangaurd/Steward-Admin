"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import type { ApiSuccess, MenuItem } from "@/types";
import { useAuthStore } from "@/stores/auth.store";

export const MENU_ITEMS_QUERY_KEY = ["menu-items"] as const;

/** Returns true for restaurant owners / admins who can use the /admin/* routes */
function useIsAdmin() {
  const user = useAuthStore((s) => s.user);
  return user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
}

export function useMenuItems() {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: [...MENU_ITEMS_QUERY_KEY, isAdmin ? "admin" : "staff"],
    queryFn: async () => {
      // Admin endpoint returns full item list with all meta.
      // Kitchen staff use the same endpoint scoped via their JWT restaurant context.
      // If the backend returns 403 on the admin endpoint for staff, we fall back
      // to the standard items endpoint which is accessible to all restaurant users.
      try {
        const { data } = await api.get<ApiSuccess<MenuItem[]>>(
          isAdmin ? "/menu/admin/items" : "/menu/items",
          { params: { limit: 200, page: 1 } }
        );
        return data.data;
      } catch (err: any) {
        // If staff get a 403 on /menu/admin/items, retry on /menu/items
        if (!isAdmin || err?.response?.status === 403) {
          const { data } = await api.get<ApiSuccess<MenuItem[]>>(
            "/menu/items",
            { params: { limit: 200, page: 1 } }
          );
          return data.data;
        }
        throw err;
      }
    },
  });
}

export function useItemAvailability() {
  const queryClient = useQueryClient();
  const isAdmin = useIsAdmin();

  return useMutation({
    mutationFn: async ({
      itemId,
      input,
    }: {
      itemId: string;
      input: { isAvailable: boolean };
    }) => {
      // Admins use the privileged admin route; kitchen staff use the kitchen route
      const endpoint = isAdmin
        ? `/menu/admin/items/${itemId}/availability`
        : `/menu/items/${itemId}/availability`;
      try {
        const { data } = await api.patch<ApiSuccess<MenuItem>>(endpoint, input);
        return data.data;
      } catch (err: any) {
        // Fall back to the other endpoint if the first returns 403
        if (err?.response?.status === 403) {
          const fallback = `/menu/items/${itemId}/availability`;
          const { data } = await api.patch<ApiSuccess<MenuItem>>(fallback, input);
          return data.data;
        }
        throw err;
      }
    },

    // Optimistic update — invalidate the broader key to cover both admin & staff variants.
    async onMutate({ itemId, input }) {
      await queryClient.cancelQueries({ queryKey: MENU_ITEMS_QUERY_KEY });
      // Update all cached variants (admin & staff keys both start with MENU_ITEMS_QUERY_KEY)
      const queryKey = [...MENU_ITEMS_QUERY_KEY, isAdmin ? "admin" : "staff"] as const;
      const previousItems = queryClient.getQueryData<MenuItem[]>(queryKey);

      queryClient.setQueryData<MenuItem[]>(queryKey, (items) =>
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
      const queryKey = [...MENU_ITEMS_QUERY_KEY, isAdmin ? "admin" : "staff"] as const;
      queryClient.setQueryData<MenuItem[]>(queryKey, (items) =>
        items?.map((current) => (current.id === updatedItem.id ? updatedItem : current))
      );
      toast.success(
        `${updatedItem.name} marked ${updatedItem.isAvailable ? "available" : "unavailable"}`
      );
    },

    onError(error: unknown, _variables, context) {
      const queryKey = [...MENU_ITEMS_QUERY_KEY, isAdmin ? "admin" : "staff"] as const;
      if (context?.previousItems) {
        queryClient.setQueryData(queryKey, context.previousItems);
      }
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err?.response?.data?.message ??
          (error instanceof Error ? error.message : "Could not update item")
      );
    },
  });
}
