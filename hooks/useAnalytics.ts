"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type {
  AnalyticsSummary,
  RevenueDataPoint,
  TopItem,
  HourlyDataPoint,
  ApiSuccess,
} from "@/types";

interface DateParams {
  from: string;
  to: string;
}

export function useAnalyticsSummary(params: DateParams) {
  return useQuery({
    queryKey: ["analytics-summary", params],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<AnalyticsSummary>>(
        "/admin/analytics/summary",
        { params }
      );
      return data.data;
    },
  });
}

export function useRevenueData(params: DateParams) {
  return useQuery({
    queryKey: ["analytics-revenue", params],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<RevenueDataPoint[]>>(
        "/admin/analytics/revenue",
        { params }
      );
      return data.data;
    },
  });
}

export function useTopItems(params: DateParams) {
  return useQuery({
    queryKey: ["analytics-top-items", params],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<TopItem[]>>(
        "/admin/analytics/top-items",
        { params }
      );
      return data.data;
    },
  });
}

export function useHourlyData(params: DateParams) {
  return useQuery({
    queryKey: ["analytics-hourly", params],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<HourlyDataPoint[]>>(
        "/admin/analytics/hourly",
        { params }
      );
      return data.data;
    },
  });
}