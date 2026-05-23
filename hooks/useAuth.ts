"use client";

import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import api from "@/lib/axios";
import { disconnectSocket } from "@/lib/sockets";
import type { User } from "@/types";

export function useAuth() {
  const { accessToken, user, setAuth, clearAuth } = useAuthStore();
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

  return { accessToken, user, isAdmin, setAuth, clearAuth, logout };
}

export function useRequireAuth() {
  const { accessToken, user } = useAuthStore();
  return { isAuthenticated: !!accessToken, user };
}

export type { User };
