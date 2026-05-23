import { create } from "zustand";
import type { User } from "@/types";

const TOKEN_KEY = "auth-token";
const USER_KEY = "auth-user";

interface AuthStore {
  accessToken: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

function loadFromStorage(): { accessToken: string | null; user: User | null } {
  if (typeof window === "undefined") return { accessToken: null, user: null };
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = localStorage.getItem(USER_KEY);
    if (token && user) return { accessToken: token, user: JSON.parse(user) };
  } catch {}
  return { accessToken: null, user: null };
}

export const useAuthStore = create<AuthStore>((set) => ({
  ...loadFromStorage(),
  setAuth: (token, user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ accessToken: token, user });
  },
  clearAuth: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    set({ accessToken: null, user: null });
  },
}));
