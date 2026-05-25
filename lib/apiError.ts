/**
 * Centralized API error extraction.
 * Converts any axios error / unknown value → human-readable string.
 */

import type { AxiosError } from "axios";
import type { ApiError } from "@/types";

export function extractApiError(err: unknown, fallback = "Something went wrong"): string {
  if (!err) return fallback;

  const axiosErr = err as AxiosError<ApiError>;
  const data = axiosErr?.response?.data;

  if (data?.message) return data.message;
  if (axiosErr?.message) return axiosErr.message;
  if (typeof err === "string") return err;

  return fallback;
}
