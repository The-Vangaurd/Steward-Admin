"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import { extractApiError } from "@/lib/apiError";
import type { ApiSuccess } from "@/types";
import type { RestaurantSettings } from "@/types/settings";
import { DEFAULT_SETTINGS } from "@/types/settings";

export const SETTINGS_QUERY_KEY = ["restaurant-settings"] as const;

function formatAddress(addr: unknown): string {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  if (typeof addr === "object") {
    const a = addr as Record<string, unknown>;
    if (a.street || a.city || a.state || a.zip) {
      return [a.street, a.city, a.state, a.zip].filter(Boolean).join(", ");
    }
    try {
      return JSON.stringify(a);
    } catch {
      return "";
    }
  }
  return String(addr);
}

/**
 * Merge server data with DEFAULT_SETTINGS so any field the backend hasn't
 * persisted yet (e.g. openingHours on a fresh account) is filled with a safe
 * default instead of undefined — which would crash tab components that
 * destructure fields unconditionally.
 */
function normaliseSettings(raw: Partial<RestaurantSettings> | null | undefined): RestaurantSettings {
  const settings = raw ?? {};
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    address: formatAddress(settings.address),
    // openingHours must always be a complete schedule — guard against null/partial
    openingHours: {
      ...DEFAULT_SETTINGS.openingHours,
      ...(settings.openingHours ?? {}),
    },
  };
}

export function useRestaurantSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async () => {
      try {
        const { data } = await api.get<ApiSuccess<Partial<RestaurantSettings>>>("/settings");
        return normaliseSettings(data.data ?? {});
      } catch (err: any) {
        // Keep the settings page usable if this endpoint is temporarily down.
        console.warn("Falling back to default settings", err?.response?.status ?? err);
        return normaliseSettings({});
      }
    },
    staleTime: 1000 * 60 * 5, // 5 min — settings rarely change mid-session
  });
}

export function useUpdateRestaurantSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<RestaurantSettings>) => {
      // Split fields between /settings/profile (name, contact, locale) and
      // /settings (everything else) because the backend exposes two endpoints.
      const profileKeys = ["name", "tagline", "email", "phone", "address", "currency", "timezone"] as const;

      const profileFields: Record<string, unknown> = {};
      const settingsFields: Record<string, unknown> = {};
      let hasProfile  = false;
      let hasSettings = false;

      for (const [key, value] of Object.entries(settings)) {
        if (profileKeys.includes(key as typeof profileKeys[number])) {
          hasProfile = true;
          // Backend stores tagline as "description" in the profile table
          profileFields[key === "tagline" ? "description" : key] = value;
        } else {
          hasSettings = true;
          settingsFields[key] = value;
        }
      }

      const promises: Promise<unknown>[] = [];
      if (hasProfile)  promises.push(api.patch<ApiSuccess<unknown>>("/settings/profile", profileFields));
      if (hasSettings) promises.push(api.patch<ApiSuccess<unknown>>("/settings", settingsFields));

      // Fire both patches in parallel — no dependency between them
      const results = await Promise.all(promises);

      // Merge both responses into one object
      let merged: Record<string, unknown> = {};
      for (const res of results) {
        const r = res as { data?: { data?: Record<string, unknown> } };
        if (r.data?.data) merged = { ...merged, ...r.data.data };
      }

      // Remap description → tagline to keep the frontend type consistent
      if ("description" in merged) {
        merged["tagline"] = merged["description"];
        delete merged["description"];
      }

      return normaliseSettings(merged as Partial<RestaurantSettings>);
    },

    onSuccess: (data) => {
      // Update the query cache so useRestaurantSettings reflects the new data
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
