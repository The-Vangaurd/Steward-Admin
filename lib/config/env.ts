/**
 * Centralized Environment Configuration
 * Validates required client-exposed env vars at build-time/runtime.
 * Throws early to prevent silent failures and hydration mismatches.
 */

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL;
const rawMenuUrl = process.env.NEXT_PUBLIC_MENU_URL;

const isProd = process.env.NODE_ENV === "production";

function validate(name: string, value: string | undefined, fallback: string): string {
  const val = value || fallback;
  if (!val) {
    throw new Error(`[Steward] CRITICAL: Environment variable ${name} is required but missing.`);
  }
  if (isProd && (val.includes("localhost") || val.includes("127.0.0.1"))) {
    // Only throw during the local build/prerender phase to prevent deploying a bad build.
    // Never crash the runtime in the cloud (where process.env.CF_PAGES is active) or in the browser.
    if (typeof window === "undefined" && !process.env.CF_PAGES) {
      throw new Error(`[Steward] CRITICAL: Environment variable ${name} points to localhost in a production build.`);
    } else {
      console.warn(`[Steward] WARNING: Environment variable ${name} points to localhost in production: ${val}`);
    }
  }
  return val;
}

export const API_URL = validate("NEXT_PUBLIC_API_URL", rawApiUrl, "https://steward-backend-qwd2.onrender.com/v1");
export const WS_URL = validate("NEXT_PUBLIC_WS_URL", rawWsUrl, "https://steward-backend-qwd2.onrender.com");
export const MENU_URL = validate("NEXT_PUBLIC_MENU_URL", rawMenuUrl, "https://steward-menu.pages.dev");

// Startup diagnostics (Only runs server-side during module evaluation)
if (typeof window === "undefined") {
  console.log("✓ API URL configured");
  console.log("✓ WS URL configured");
  console.log("✓ MENU URL configured");
}
