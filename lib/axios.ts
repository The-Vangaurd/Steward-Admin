import axios from "axios";
import { getCsrfHeader } from "@/lib/auth/csrf";
import { useAuthStore } from "@/stores/auth.store";

// ── API URL validation ────────────────────────────────────────────────────────
// NEXT_PUBLIC_API_URL is embedded at build time by Next.js. If it is missing
// the entire settings page will hang on isLoading forever, because every
// request goes to "undefined/settings" which never resolves.
//
// We validate eagerly so engineers see a clear error rather than a silent
// infinite spinner in production.
const rawApiUrl =
  typeof process !== "undefined" && process.env
    ? process.env.NEXT_PUBLIC_API_URL
    : undefined;

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

export const api = axios.create({
  baseURL: "/v1",
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

// ── Request interceptor: attach in-memory access token ───────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  Object.assign(config.headers, getCsrfHeader());
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ── Response interceptor: silent token refresh on 401 ────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise(function (resolve, reject) {
        const localRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('auth-refresh-token') : null;
        axios
          .post(
            "/v1/auth/refresh",
            { refreshToken: localRefreshToken },
            { withCredentials: true, headers: getCsrfHeader() }
          )
          .then(({ data }) => {
            const newAccessToken: string = data.data.accessToken;
            const newRefreshToken: string = data.data.refreshToken;
            useAuthStore.getState().setAccessToken(newAccessToken, newRefreshToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken);
            resolve(api(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            const refreshStatus = err?.response?.status;
            if (!refreshStatus || refreshStatus === 401 || refreshStatus === 403) {
              // Only force logout when the server explicitly rejects the refresh token.
              // No response (network error / server sleeping) — leave the user alone.
              if (refreshStatus) {
                useAuthStore.getState().clearAuth();
                if (typeof window !== "undefined") {
                  window.location.href = "/login";
                }
              }
            }
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  },
);

export default api;
