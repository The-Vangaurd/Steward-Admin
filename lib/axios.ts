import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL!;

export const api = axios.create({
  baseURL,
  withCredentials: true, // required so the httpOnly refreshToken cookie is sent
});

// Lazy import to avoid circular dependency
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
//
// When the access token expires the server returns 401.
// We call /auth/refresh — the httpOnly refreshToken cookie is sent automatically
// (withCredentials: true). The backend rotates the refresh cookie and returns
// a new accessToken in the response body.
//
// We update ONLY the in-memory accessToken via setAccessToken() — we do NOT
// call setAuth() because we don't want to re-write the user to localStorage
// and we don't have an updated user object here anyway.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const { data } = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newAccessToken: string = data.data.accessToken;

        // In-memory update only — no localStorage write
        getAuthStore().getState().setAccessToken(newAccessToken);

        // Retry the original request with the new token
        error.config.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(error.config);
      } catch {
        // Refresh failed (e.g. cookie expired/revoked) — force logout
        getAuthStore().getState().clearAuth();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
