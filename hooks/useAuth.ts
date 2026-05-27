'use client';

import { useAuthStore } from '@/stores/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/axios';
import { disconnectSocket } from '@/lib/sockets';
import { getRedirectPath } from '@/constants/auth';
import type { User } from '@/types';
import type { Restaurant } from '@/stores/auth.store';

// ─── Primary hook — used everywhere inside dashboard layout ──────────────────

export function useAuth() {
  const { accessToken, user, restaurant, setAuth, setAccessToken, clearAuth } = useAuthStore();
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore — clear client state regardless
    } finally {
      clearAuth();
      disconnectSocket();
      router.push('/login');
    }
  }, [clearAuth, router]);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isStaff = user?.role === 'KITCHEN_STAFF' || user?.role === 'WAITER';

  return {
    accessToken,
    user,
    restaurant,
    isAdmin,
    isStaff,
    setAuth,
    setAccessToken,
    clearAuth,
    logout,
  };
}

// ─── Route guard hook — used in dashboard layouts ────────────────────────────
//
// Usage:
//   const { isReady, isAuthenticated } = useRequireAuth({ redirectTo: '/login' });
//   if (!isReady) return <FullPageSpinner />;  // prevents flash
//
// How it works:
//   - On hard refresh, accessToken is null (cleared from memory) but user may
//     exist in localStorage. This is "pending refresh" — the axios interceptor
//     will silently re-issue the token on the first API call.
//   - We treat "user exists, token pending" as authenticated to avoid
//     incorrectly bouncing users to the login page on every refresh.
//   - Once the component has mounted (client-side), isReady becomes true and
//     the consumer can safely check authentication state.

interface UseRequireAuthOptions {
  redirectTo?: string;
  /** If true, redirect already-authed users (use on login/register pages). */
  redirectIfAuthenticated?: boolean;
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { redirectTo = '/login', redirectIfAuthenticated = false } = options;
  const { accessToken, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  // "known authenticated" = has a token in memory OR user cached from localStorage
  // (pending silent refresh). Either way the user IS logged in.
  const isAuthenticated = !!accessToken || !!user;

  useEffect(() => {
    // Mark as ready after first mount so SSR/hydration doesn't mismatch
    setIsReady(true);

    if (redirectIfAuthenticated && isAuthenticated && user) {
      router.replace(getRedirectPath(user.role));
      return;
    }

    if (!redirectIfAuthenticated && !isAuthenticated) {
      // Preserve the intended destination so we can redirect back after login
      const callbackUrl = encodeURIComponent(pathname ?? '/dashboard');
      router.replace(`${redirectTo}?next=${callbackUrl}`);
    }
  }, [isAuthenticated, redirectIfAuthenticated, redirectTo, router, pathname, user]);

  return {
    isReady,
    isAuthenticated,
    /** true when user is cached but accessToken hasn't been refreshed yet */
    isPendingRefresh: !accessToken && !!user,
    user,
  };
}

export type { User, Restaurant };
