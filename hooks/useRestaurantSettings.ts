"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import { extractApiError } from "@/lib/apiError";
import type { ApiSuccess } from "@/types";
import type { RestaurantSettings } from "@/types/settings";
import { DEFAULT_SETTINGS } from "@/types/settings";

export const SETTINGS_QUERY_KEY = ["restaurant-settings"] as const;

// ── Address normalisation ─────────────────────────────────────────────────────

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

// ── Backend ↔ Frontend field mapping ─────────────────────────────────────────
//
// The backend stores font as `fontBody` + `fontHeading` (separate DB columns).
// The frontend uses a single `fontFamily` field.
//
// On GET: backend response may contain `fontBody`, `fontHeading`, or both.
//         We map fontBody (preferred) → fontFamily; fall back to fontHeading.
//         If neither is present we keep DEFAULT_SETTINGS.fontFamily ("Inter").
//
// On PATCH: frontend sends `fontFamily`; we map it to BOTH `fontBody` AND
//           `fontHeading` so the backend stays internally consistent.
//           The key `fontFamily` is NOT sent — the backend's Zod patchSchema
//           would silently strip it, causing the save to appear successful
//           while the value is never persisted.

type RawServerSettings = Omit<RestaurantSettings, "fontFamily"> & {
  fontBody?: string | null;
  fontHeading?: string | null;
  // backend tagline is stored as description on the Restaurant table
  description?: string | null;
  // backend returns these from the profile merge
  logoUrl?: string | null;
  bannerUrl?: string | null;
  secondaryColor?: string | null;
  slug?: string | null;
};

/**
 * Merge server data with DEFAULT_SETTINGS.
 * - Maps fontBody/fontHeading → fontFamily
 * - Maps description → tagline
 * - Preserves slug and secondaryColor
 * - Guards openingHours against null/partial server responses
 * - Fills every missing field with a safe default so components never receive
 *   undefined for a field they unconditionally destructure
 */
function normaliseSettings(raw: Partial<RawServerSettings>): RestaurantSettings {
  // Resolve fontFamily from backend naming
  const fontFamily =
    (raw.fontBody ?? raw.fontHeading) ||
    DEFAULT_SETTINGS.fontFamily;

  // Resolve tagline from either backend field name
  const tagline =
    typeof raw.tagline === "string"
      ? raw.tagline
      : typeof raw.description === "string"
      ? raw.description
      : DEFAULT_SETTINGS.tagline;

  return {
    ...DEFAULT_SETTINGS,
    ...(raw as Partial<RestaurantSettings>),
    // Explicit overrides — these must come AFTER the spread so they win
    fontFamily,
    tagline,
    address: formatAddress(raw.address),
    logoUrl: raw.logoUrl ?? DEFAULT_SETTINGS.logoUrl,
    bannerUrl: raw.bannerUrl ?? DEFAULT_SETTINGS.bannerUrl,
    secondaryColor: raw.secondaryColor ?? DEFAULT_SETTINGS.secondaryColor,
    slug: raw.slug ?? undefined,
    // openingHours must always be a complete schedule
    openingHours: {
      ...DEFAULT_SETTINGS.openingHours,
      ...(raw.openingHours ?? {}),
    },
  };
}

/**
 * Map the frontend RestaurantSettings shape back to what the backend PATCH
 * endpoints accept.
 *
 * - fontFamily → fontBody + fontHeading (backend columns)
 * - tagline    → description            (backend profile column)
 * - slug       → stripped (read-only)
 * - secondaryColor → passed through as-is (exists in patchSchema)
 */
function toBackendSettingsPatch(settings: Partial<RestaurantSettings>): Record<string, unknown> {
  const { fontFamily, tagline, slug, ...rest } = settings;
  const patch: Record<string, unknown> = { ...rest };

  if (fontFamily !== undefined) {
    patch.fontBody = fontFamily;
    patch.fontHeading = fontFamily;
    // Never send the frontend-only field to the backend
    delete patch.fontFamily;
  }

  // tagline is remapped in the profile branch — strip it here so it is not
  // sent to the /settings endpoint where it would be silently stripped by Zod
  delete patch.tagline;

  // slug is read-only — never send it
  delete patch.slug;

  return patch;
}

// ── Query hook ────────────────────────────────────────────────────────────────

export function useRestaurantSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async () => {
      try {
        const { data } = await api.get<ApiSuccess<Partial<RestaurantSettings>>>("/settings");
        return normaliseSettings(data.data ?? {});
      } catch (err: any) {
        // First-time setup: no settings exist yet — use safe defaults
        if (err?.response?.status === 404) return normaliseSettings({});
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 min — settings rarely change mid-session
    retry: (failureCount, error: unknown) => {
      // Do not retry on 4xx errors — they indicate a configuration problem
      const e = error as { response?: { status?: number } };
      const status = e?.response?.status ?? 0;
      if (status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
  });
}

// ── Mutation hook ─────────────────────────────────────────────────────────────

export function useUpdateRestaurantSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<RestaurantSettings>) => {
      // Profile fields live on the Restaurant table (PATCH /settings/profile)
      // All other fields live on RestaurantSettings (PATCH /settings)
      const profileKeys = ["name", "tagline", "email", "phone", "address", "currency", "timezone"] as const;

      const profileFields: Record<string, unknown> = {};
      const settingsFields: Record<string, unknown> = {};
      let hasProfile  = false;
      let hasSettings = false;

      for (const [key, value] of Object.entries(settings)) {
        if (profileKeys.includes(key as typeof profileKeys[number])) {
          hasProfile = true;
          // Backend stores tagline as "description" in the Restaurant table
          profileFields[key === "tagline" ? "description" : key] = value;
        } else {
          hasSettings = true;
          settingsFields[key] = value;
        }
      }

      // Apply fontFamily → fontBody/fontHeading mapping for the settings patch
      const mappedSettingsFields = hasSettings
        ? toBackendSettingsPatch(settingsFields as Partial<RestaurantSettings>)
        : {};

      // ── Sequential PATCH to avoid partial-save race condition ────────────────
      // We previously used Promise.all() here, but that creates a race: if
      // profilePATCH succeeds and settingsPATCH fails (or vice versa), the DB
      // is left in a half-updated state that the rollback in onError can't undo
      // (rollback only reverses the optimistic UI update, not the DB write).
      //
      // Sequential requests ensure that a failure stops before the second write.
      // The latency cost is ~50–100 ms (one extra round-trip when both fields
      // change together), which is acceptable for an infrequent settings save.
      const results: { data?: { data?: Record<string, unknown> } }[] = [];

      if (hasProfile) {
        const r = await api.patch<ApiSuccess<Record<string, unknown>>>(
          "/settings/profile",
          profileFields
        );
        results.push(r as { data?: { data?: Record<string, unknown> } });
      }

      if (hasSettings && Object.keys(mappedSettingsFields).length > 0) {
        const r = await api.patch<ApiSuccess<Record<string, unknown>>>(
          "/settings",
          mappedSettingsFields
        );
        results.push(r as { data?: { data?: Record<string, unknown> } });
      }

      // Merge both partial responses, then get the full canonical state by
      // re-fetching. This avoids the "partial response overwriting full cache"
      // problem: the PATCH responses only return the fields they touched, so
      // merging them can leave the cache incomplete.
      //
      // Strategy: merge what we got, but then immediately invalidate so the
      // next render re-fetches the canonical GET /settings response.
      let merged: Record<string, unknown> = {};
      for (const res of results) {
        if (res.data?.data) merged = { ...merged, ...res.data.data };
      }

      // Remap description → tagline for cache consistency
      if ("description" in merged) {
        merged["tagline"] = merged["description"];
        delete merged["description"];
      }

      // Build a normalised object from the merge. The cache will be
      // immediately invalidated below so this is only used for the
      // optimistic return value — the next query will get the real data.
      return normaliseSettings(merged as Partial<RawServerSettings>);
    },

    onMutate: async (newSettings: Partial<RestaurantSettings>) => {
      // Cancel any in-flight refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: SETTINGS_QUERY_KEY });

      // Snapshot current cache for rollback on error
      const previousSettings = queryClient.getQueryData<RestaurantSettings>(SETTINGS_QUERY_KEY);

      // Optimistic update — merge new values into the existing cache so the UI
      // reflects the change immediately without waiting for the server
      if (previousSettings) {
        queryClient.setQueryData<RestaurantSettings>(SETTINGS_QUERY_KEY, {
          ...previousSettings,
          ...newSettings,
        });
      }

      return { previousSettings };
    },

    onSuccess: () => {
      // Invalidate the cache so the next render triggers a fresh GET /settings.
      // This ensures the canonical server state (including any server-side
      // normalisation) replaces the optimistic update.
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      toast.success("Settings saved");
    },

    onError: (err, _newSettings, context) => {
      // Roll back the optimistic update on error
      if (context?.previousSettings) {
        queryClient.setQueryData(SETTINGS_QUERY_KEY, context.previousSettings);
      }
      toast.error(extractApiError(err, "Failed to save settings"));
    },
  });
}

// ── Asset upload hook ─────────────────────────────────────────────────────────

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
      const e = err as { response?: { status?: number; data?: { error?: { message?: string } } } };
      if (e?.response?.status === 503) {
        toast.error("Image uploads are not configured. Please set Cloudinary credentials.");
      } else {
        toast.error(extractApiError(err, "Upload failed"));
      }
    },
  });
}
