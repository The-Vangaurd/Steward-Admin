import axios from "axios";

// ── API URL validation ────────────────────────────────────────────────────────
// NEXT_PUBLIC_API_URL is embedded at build time by Next.js. If it is missing
// the entire settings page will hang on isLoading forever, because every
// request goes to "undefined/settings" which never resolves.
//
// We validate eagerly so engineers see a clear error rather than a silent
// infinite spinner in production.
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!rawApiUrl) {
  // In the browser this surfaces as a console error; in SSR it logs server-side.
  // We do NOT throw here because it would crash the Next.js build — instead we
  // surface it visibly so the deployed app shows a clear error state.
  console.error(
    "[Steward] CRITICAL: NEXT_PUBLIC_API_URL is not set. " +
    "All API calls will fail. " +
    "Set this variable in Vercel (Settings → Environment Variables) " +
    "and redeploy."
  );
}

// Guard against a placeholder localhost URL leaking into production builds.
// Vercel sets NODE_ENV=production during `next build`.
if (
  typeof process !== "undefined" &&
  process.env.NODE_ENV === "production" &&
  rawApiUrl &&
  (rawApiUrl.includes("localhost") || rawApiUrl.includes("127.0.0.1"))
) {
  console.error(
    "[Steward] CRITICAL: NEXT_PUBLIC_API_URL points to localhost in a " +
    "production build. Set the real backend URL in Vercel Environment Variables."
  );
}

const baseURL = rawApiUrl ?? "";

export const api = axios.create({
  baseURL,
  /**
   * withCredentials: true
   *
   * Required for the httpOnly refreshToken cookie to be included in every
   * request sent by this axios instance. Without it the browser strips all
   * cookies from cross-origin requests and the silent-refresh flow breaks.
   *
   * CORS dependency: the backend must respond with:
   *   Access-Control-Allow-Origin: <exact origin>   (not *)
   *   Access-Control-Allow-Credentials: true
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
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;

      try {
        const refreshTokenFallback = getAuthStore().getState().refreshToken;
        const { data } = await axios.post(
          `${baseURL}/auth/refresh`,
          refreshTokenFallback ? { refreshToken: refreshTokenFallback } : {},
          { withCredentials: true },
        );

        const newAccessToken: string = data.data.accessToken;
        getAuthStore().getState().setAccessToken(newAccessToken);

        error.config.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(error.config);
      } catch (refreshError) {
        getAuthStore().getState().clearAuth();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
