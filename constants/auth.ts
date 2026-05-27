// ─── Auth constants ───────────────────────────────────────────────────────────

export const AUTH_TABS = {
  ADMIN: 'admin',
  STAFF: 'staff',
} as const;

export type AuthTab = (typeof AUTH_TABS)[keyof typeof AUTH_TABS];

/** Maps user role to the correct post-login destination. */
export function getRedirectPath(role: string): string {
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return '/dashboard';
  if (role === 'KITCHEN_STAFF') return '/kitchen';
  if (role === 'WAITER') return '/kitchen';
  return '/dashboard';
}

/** Local-storage key for persisted user profile (non-sensitive). */
export const USER_STORAGE_KEY = 'auth-user';

/** Local-storage key for persisted restaurant info (non-sensitive). */
export const RESTAURANT_STORAGE_KEY = 'auth-restaurant';
