"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import { extractApiError } from "@/lib/apiError";
import type { ApiSuccess } from "@/types";
import type { RestaurantSettings } from "@/types/settings";
import { DEFAULT_SETTINGS } from "@/types/settings";

export const SETTINGS_QUERY_KEY = ["restaurant-settings"] as const;

export function useRestaurantSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async () => {
      try {
        const { data } = await api.get<ApiSuccess<RestaurantSettings>>("/restaurant/settings");
        return data.data;
      } catch {
        // Return defaults if endpoint not yet available
        return DEFAULT_SETTINGS;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useUpdateRestaurantSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<RestaurantSettings>) => {
      const { data } = await api.patch<ApiSuccess<RestaurantSettings>>(
        "/restaurant/settings",
        settings
      );
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEY, data);
      toast.success("Settings saved");
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to save settings"));
    },
  });
}

export function useUploadAsset() {
  return useMutation({
    mutationFn: async ({ file, type }: { file: File; type: "logo" | "banner" }) => {
      const form = new FormData();
      form.append("file", file);
      form.append("type", type);
      const { data } = await api.post<ApiSuccess<{ url: string }>>(
        "/restaurant/assets/upload",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data.data.url;
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Upload failed"));
    },
  });
}
