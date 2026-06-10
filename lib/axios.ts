import axios from "axios";
import { getCsrfHeader } from "@/lib/auth/csrf";
import { API_BASE_URL } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth.store";



export const api = axios.create({
  baseURL: API_BASE_URL,
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
            `${API_BASE_URL}/auth/refresh`,
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
