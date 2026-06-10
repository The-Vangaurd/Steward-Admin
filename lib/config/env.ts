/**
 * Centralized Environment Configuration
 * Validates required client-exposed env vars at build-time/runtime.
 * Throws early to prevent silent failures and hydration mismatches.
 */

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL;
const rawMenuUrl = process.env.NEXT_PUBLIC_MENU_URL;

const isProd = process.env.NODE_ENV === "production";

function validate(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`[Steward] CRITICAL: Environment variable ${name} is required but missing.`);
  }
  if (isProd && (value.includes("localhost") || value.includes("127.0.0.1"))) {
    throw new Error(`[Steward] CRITICAL: Environment variable ${name} points to localhost in a production build.`);
  }
  return value;
}

export const API_URL = validate("NEXT_PUBLIC_API_URL", rawApiUrl);
export const WS_URL = validate("NEXT_PUBLIC_WS_URL", rawWsUrl);
export const MENU_URL = validate("NEXT_PUBLIC_MENU_URL", rawMenuUrl);

// Startup diagnostics (Only runs server-side during module evaluation)
if (typeof window === "undefined") {
  console.log("✓ API URL configured");
  console.log("✓ WS URL configured");
  console.log("✓ MENU URL configured");
}
