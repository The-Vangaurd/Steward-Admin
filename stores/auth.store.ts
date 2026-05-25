import { create } from "zustand";
import type { User } from "@/types";

// ── SECURITY FIX: Access token removed from localStorage ──────────────────────
//
// Previously:
//   localStorage.setItem("auth-token", accessToken)   ← XSS-readable
//   localStorage.setItem("auth-user", JSON.stringify(user))
//
// Now:
//   accessToken lives ONLY in Zustand in-memory state.
//   user object is persisted to localStorage (non-sensitive profile data only).
//   refreshToken lives ONLY in httpOnly cookie (set by backend — JS-unreadable).
//
// On hard refresh the user object is restored from localStorage so the UI
// can render immediately, but the access token is gone. The axios interceptor
// in lib/axios.ts calls /auth/refresh on the first 401, which issues a new
// access token from the httpOnly refresh cookie — the "silent login" flow.
//
// This means XSS can steal user profile data but NOT the tokens needed to
// make authenticated API calls.

const USER_KEY = "auth-user";

interface AuthStore {
  /** In-memory only — never written to localStorage or sessionStorage */
  accessToken: string | null;
  /** Non-sensitive profile info — persisted for immediate UI render on refresh */
  user: User | null;
  setAuth: (token: string, user: User) => void;
  /** Call when a new access token is issued (silent refresh) without a user change */
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
}

function loadUserFromStorage(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthStore>((set) => ({
  // accessToken is intentionally NOT seeded from storage — it must come from
  // the silent refresh flow so we always hold a fresh, valid JWT in memory.
  accessToken: null,
  user: loadUserFromStorage(),

  setAuth: (token, user) => {
    // Persist user profile (role, name, etc.) so the UI doesn't flash on reload.
    // Never persist the access token.
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ accessToken: token, user });
  },

  setAccessToken: (token) => {
    // Used by the silent-refresh interceptor: only updates the token in memory.
    set({ accessToken: token });
  },

  clearAuth: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(USER_KEY);
    }
    set({ accessToken: null, user: null });
  },
}));
