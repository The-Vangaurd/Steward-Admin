import { create } from 'zustand';
import type { User } from '@/types';
import { USER_STORAGE_KEY, RESTAURANT_STORAGE_KEY, TOKEN_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY } from '@/constants/auth';

// ── Security note ──────────────────────────────────────────────────────────────
//
// accessToken  → in-memory ONLY (never localStorage/sessionStorage).
// user         → localStorage (non-sensitive profile; survives hard refresh).
// restaurant   → localStorage (non-sensitive; survives hard refresh).
// refreshToken → httpOnly cookie set by backend (JS-unreadable).
//
// On hard refresh: user+restaurant are restored from localStorage immediately
// so the UI renders without a flash. The axios interceptor calls /auth/refresh
// on the first 401 to silently recover the accessToken from the cookie.
//
// XSS impact: attacker can read user/restaurant profile but NOT call authed APIs.

// ─── Restaurant shape ─────────────────────────────────────────────────────────

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  restaurantCode?: string;
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface AuthStore {
  accessToken: string | null;
  /** Non-sensitive profile — persisted for immediate UI render on refresh */
  user: User | null;
  /** Non-sensitive restaurant info — persisted alongside user */
  restaurant: Restaurant | null;

  /** Called after a successful email/password login or silent refresh. */
  setAuth: (token: string, user: User, restaurant?: Restaurant | null | undefined, refreshToken?: string | null) => void;
  /** Called by the silent-refresh interceptor — only updates the token. */
  setAccessToken: (token: string, refreshToken?: string | null) => void;
  /** Hard logout — clears all client state and storage. */
  clearAuth: () => void;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function read<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded — not fatal, just skip.
  }
}

function remove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: read<string>(TOKEN_STORAGE_KEY),
  user: read<User>(USER_STORAGE_KEY),
  restaurant: read<Restaurant>(RESTAURANT_STORAGE_KEY),

  setAuth: (token, user, restaurant = undefined, refreshToken = null) => {
    write(TOKEN_STORAGE_KEY, token);
    write(USER_STORAGE_KEY, user);
    if (restaurant !== undefined) {
      if (restaurant) {
        write(RESTAURANT_STORAGE_KEY, restaurant);
      } else {
        remove(RESTAURANT_STORAGE_KEY);
      }
    }
    if (refreshToken) {
      write(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    }
    set((state) => ({
      accessToken: token,
      user,
      restaurant: restaurant !== undefined ? restaurant : state.restaurant,
    }));
  },

  setAccessToken: (token, refreshToken = null) => {
    write(TOKEN_STORAGE_KEY, token);
    if (refreshToken) {
      write(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    }
    set({ accessToken: token });
  },

  clearAuth: () => {
    remove(TOKEN_STORAGE_KEY);
    remove(REFRESH_TOKEN_STORAGE_KEY);
    remove(USER_STORAGE_KEY);
    remove(RESTAURANT_STORAGE_KEY);
    set({ accessToken: null, user: null, restaurant: null });
  },
}));
