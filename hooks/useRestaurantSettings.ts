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
        const { data } = await api.get<ApiSuccess<RestaurantSettings>>("/settings");
        return data.data;
      } catch (err: any) {
        if (err?.response?.status === 404) {
          return DEFAULT_SETTINGS;
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useUpdateRestaurantSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<RestaurantSettings>) => {
      const profileKeys = ["name", "tagline", "email", "phone", "address", "currency", "timezone"] as const;
      
      const profileFields: Record<string, any> = {};
      const settingsFields: Record<string, any> = {};
      let hasProfile = false;
      let hasSettings = false;

      for (const [key, value] of Object.entries(settings)) {
        if (profileKeys.includes(key as any)) {
          hasProfile = true;
          if (key === "tagline") {
            profileFields["description"] = value;
          } else {
            profileFields[key] = value;
          }
        } else {
          hasSettings = true;
          settingsFields[key] = value;
        }
      }

      const promises: Promise<any>[] = [];
      if (hasProfile) {
        promises.push(api.patch<ApiSuccess<any>>("/settings/profile", profileFields));
      }
      if (hasSettings) {
        promises.push(api.patch<ApiSuccess<any>>("/settings", settingsFields));
      }

      const results = await Promise.all(promises);
      
      // Merge results of both API patches
      let responseData = {};
      for (const res of results) {
        if (res.data?.data) {
          responseData = { ...responseData, ...res.data.data };
        }
      }

      if ("description" in responseData) {
        (responseData as any)["tagline"] = (responseData as any)["description"];
      }

      return responseData as RestaurantSettings;
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
        "/settings/upload",
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
