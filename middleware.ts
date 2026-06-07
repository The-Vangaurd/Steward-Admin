import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Minimal middleware ────────────────────────────────────────────────────────
//
// Auth protection is handled entirely client-side by the useRequireAuth hook
// (stores/auth.store + hooks/useAuth.ts). Attempting to enforce auth here
// would break the Google OAuth flow:
//
//   - The refreshToken is an httpOnly cookie set by the *backend* domain.
//   - Next.js Edge middleware runs on the *frontend* domain and can never
//     read a cookie that was set cross-origin by the backend.
//   - Redirecting unauthenticated requests to /login from middleware would
//     intercept the OAuth callback landing page before the client-side token
//     exchange completes, creating an infinite /login redirect loop.
//
// This file exists solely to redirect the bare root path ( / ) to /login so
// users don't land on a blank page. Everything else passes through untouched.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect bare root to login
  if (pathname === '/') {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Only run on the root path — skip all other routes entirely
  matcher: ['/'],
};
