import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL!;

export const api = axios.create({
  baseURL,
  /**
   * withCredentials: true
   *
   * This is required for the httpOnly refreshToken cookie to be included in
   * every request sent by this axios instance. Without it, the browser strips
   * all cookies from cross-origin requests and the silent-refresh flow breaks.
   *
   * CORS dependency: the backend must respond with:
   *   Access-Control-Allow-Origin: <exact origin>   (not *)
   *   Access-Control-Allow-Credentials: true
   * A wildcard origin ("*") is incompatible with credentials=true and will cause
   * the browser to block the response. The backend's CORS config uses an
   * allowedOrigins list for this reason.
   */
  withCredentials: true,
});

// Lazy import to avoid circular dependency between axios.ts ↔ auth.store.ts
function getAuthStore() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@/stores/auth.store").useAuthStore;
}

// ── Request interceptor: attach in-memory access token ───────────────────────
api.interceptors.request.use((config) => {
  const token = getAuthStore().getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: silent token refresh on 401 ────────────────────────
/**
 * HOW THE REFRESH FLOW WORKS
 * ──────────────────────────
 *
 * 1. The access token (15-minute JWT) expires.
 * 2. The next API call receives a 401 from the backend.
 * 3. This interceptor catches the 401 and fires ONE refresh request to
 *    POST /v1/auth/refresh.
 * 4. The refreshToken httpOnly cookie is sent automatically by the browser
 *    because `withCredentials: true` is set on the bare `axios.post(...)` call
 *    below. The `withCredentials` on the `api` instance does NOT apply here
 *    because we use the raw `axios` (not `api`) to avoid triggering this very
 *    interceptor recursively.
 * 5. The backend validates the cookie, rotates the refresh token (issues a new
 *    httpOnly cookie), and returns a new access token in the JSON body.
 * 6. We store the new access token in-memory via setAccessToken().
 * 7. The original failed request is retried with the new token.
 * 8. If refresh itself fails (cookie expired/revoked), we clear auth state and
 *    redirect to /login.
 *
 * WHY THE BODY IS `{}`
 * ─────────────────────
 * The refresh endpoint reads the refreshToken exclusively from the httpOnly
 * cookie (req.cookies.refreshToken), not from the request body. The empty body
 * `{}` is sent because:
 *   a) axios.post() requires at least two arguments; omitting the body
 *      argument defaults it to `undefined`, which some servers reject with 400.
 *   b) An empty object is semantically correct: "I have no body payload; my
 *      credential is in the cookie."
 * Sending any refresh token in the body would defeat the purpose of httpOnly
 * cookies (making it JS-readable), so the body must remain empty.
 *
 * COOKIE-PATH DEPENDENCY
 * ───────────────────────
 * The backend sets the refreshToken cookie with:
 *   path: '/v1/auth/refresh'
 *
 * This means the browser will ONLY send the cookie on requests whose URL path
 * starts with /v1/auth/refresh. This is a deliberate security scope reduction:
 * the refresh token is not exposed on every API call, only the one endpoint
 * that actually needs it.
 *
 * CRITICAL: if the path of the refresh endpoint ever changes (e.g. to
 * /api/auth/refresh), the cookie path on the backend MUST be updated to match,
 * and NEXT_PUBLIC_API_URL must point to the correct base so the URL constructed
 * below resolves to the same path. A mismatch will silently break refresh —
 * the browser sends the request but without the cookie, and the backend returns
 * 401, causing a redirect loop to /login.
 *
 * HOW TO TEST THE REFRESH FLOW
 * ─────────────────────────────
 * 1. Log in normally. Open DevTools → Application → Cookies — confirm the
 *    refreshToken cookie is present, HttpOnly, and path=/v1/auth/refresh.
 * 2. In the Network tab, confirm the access token is NOT stored in localStorage
 *    or sessionStorage (only the user profile is).
 * 3. To force a refresh: temporarily set JWT_EXPIRES_IN=5s in the backend env,
 *    wait 5 seconds after logging in, then make any API call. Observe a
 *    POST /v1/auth/refresh in the Network tab followed by the retried original.
 * 4. To test cookie expiry: clear the refreshToken cookie in DevTools and make
 *    any API call. You should be redirected to /login.
 *
 * PREVENTING ACCIDENTAL BREAKAGE
 * ────────────────────────────────
 * - Never change the `path` on the backend Set-Cookie without updating this comment.
 * - Never add the refreshToken to the request body — it becomes XSS-readable.
 * - Never use `api` (the intercepted instance) for the refresh call — you'll
 *   create an infinite retry loop on refresh failure.
 * - Never remove `withCredentials: true` from the raw axios.post() call below.
 */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;

      try {
        /**
         * Use raw `axios`, NOT `api`, to avoid re-triggering this interceptor.
         *
         * Body is `{}` — see "WHY THE BODY IS `{}`" above.
         * withCredentials ensures the httpOnly refreshToken cookie is sent.
         * The URL must match the cookie's `path` attribute exactly — see
         * "COOKIE-PATH DEPENDENCY" above.
         */
        const { data } = await axios.post(
          `${baseURL}/auth/refresh`,
          {},                         // empty body — token is in the httpOnly cookie
          { withCredentials: true },  // required for cookie to be sent cross-origin
        );

        const newAccessToken: string = data.data.accessToken;

        // Update only the in-memory access token — no localStorage write
        // (the store's setAccessToken() method exists for exactly this case)
        getAuthStore().getState().setAccessToken(newAccessToken);

        // Retry the original request with the fresh token
        error.config.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(error.config);
      } catch {
        // Refresh failed (expired cookie, revoked session, network error)
        getAuthStore().getState().clearAuth();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
