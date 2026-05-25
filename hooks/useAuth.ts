"use client";

import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import api from "@/lib/axios";
import { disconnectSocket } from "@/lib/sockets";
import type { User } from "@/types";

export function useAuth() {
  const { accessToken, user, setAuth, setAccessToken, clearAuth } = useAuthStore();
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore — clear client state regardless
    } finally {
      clearAuth();
      disconnectSocket();
      router.push("/login");
    }
  }, [clearAuth, router]);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return { accessToken, user, isAdmin, setAuth, setAccessToken, clearAuth, logout };
}

export function useRequireAuth() {
  // NOTE: accessToken starts null on hard refresh even for logged-in users.
  // The axios interceptor will silently refresh it on the first authenticated
  // request. Use `user` (persisted in localStorage) for immediate render decisions
  // and treat a missing accessToken as "pending refresh" rather than "logged out".
  const { accessToken, user } = useAuthStore();
  return {
    isAuthenticated: !!accessToken,
    isPendingRefresh: !accessToken && !!user, // user known but token not yet refreshed
    user,
  };
}

export type { User };
