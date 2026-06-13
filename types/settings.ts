// ─── Restaurant Settings Types ────────────────────────────────────────────────
//
// FIELD MAPPING CONTRACT (frontend ↔ backend)
// ─────────────────────────────────────────────
// The frontend uses a single `fontFamily` field (set by the branding tab).
// The backend stores two separate fields: `fontBody` and `fontHeading`.
//
// Normalisation rules (enforced in useRestaurantSettings.ts):
//   GET  /settings  → fontBody  (or fontHeading fallback) → mapped to fontFamily
//   PATCH /settings → fontFamily → mapped to fontBody (and fontHeading for parity)
//
// The frontend NEVER sends `fontBody` or `fontHeading` directly.
// The backend NEVER sees `fontFamily` in a PATCH body.
//
// `secondaryColor` is stored in the DB but is not yet surfaced in the UI.
// It is included in the type so normalisation doesn't strip it from the cache.
//
// `slug` is returned by the backend and preserved in the normalised object so
// downstream code (e.g. menu URL construction) can reference it.

export interface OpeningHours {
  open: string;   // "09:00"
  close: string;  // "22:00"
  closed: boolean;
}

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type OpeningSchedule = Record<DayOfWeek, OpeningHours>;

export const DEFAULT_OPENING_SCHEDULE: OpeningSchedule = {
  mon: { open: "09:00", close: "22:00", closed: false },
  tue: { open: "09:00", close: "22:00", closed: false },
  wed: { open: "09:00", close: "22:00", closed: false },
  thu: { open: "09:00", close: "22:00", closed: false },
  fri: { open: "09:00", close: "23:00", closed: false },
  sat: { open: "10:00", close: "23:00", closed: false },
  sun: { open: "10:00", close: "21:00", closed: false },
};

export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export interface RestaurantSettings {
  // General
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  timezone: string;
  /** Preserved from backend response; used to build public menu URLs. */
  slug?: string;

  // Branding
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
  /** Stored in DB as `secondaryColor`; not yet exposed in the branding UI. */
  secondaryColor?: string;
  accentColor: string;
  /**
   * Single font family used for the customer-facing menu.
   * Mapped from/to backend `fontBody` (and `fontHeading` on write) by the
   * normalisation layer in useRestaurantSettings.ts.
   * Components must ALWAYS use this field — never `fontBody`/`fontHeading`.
   */
  fontFamily: string;

  // Menu Appearance
  menuLayout: "grid" | "list";
  showCalories: boolean;
  showPrepTime: boolean;
  showVegBadge: boolean;
  /** Background tint for the customer-facing menu page. Empty string = default dark. */
  menuBgColor: string;
  /** Text tint for headings and labels in the customer-facing menu. */
  menuTextColor: string;

  // Operations
  taxRate: number;
  serviceCharge: number;
  serviceChargeLabel: string;
  autoAcceptOrders: boolean;
  estimatedPrepMins: number;
  offlineMode: boolean;
  offlineModeMessage: string;
  openingHours: OpeningSchedule;

  // Notifications
  notifyOnNewOrder: boolean;
  notifyOnLowStock: boolean;
  notifyEmail: string;

  // Kitchen
  /** Max dosa quantity for the current batch (Dosa Counter). Default: 8 */
  maxDosaCount: number;

  // Payments
  acceptsCash: boolean;
  acceptsCard: boolean;
  acceptsUpi: boolean;
  acceptsOnline: boolean;
  upiId: string;
  gstin: string;
  fssaiNumber: string;
  receiptFooter: string;
  showTaxBreakdown: boolean;

  // Order Types & Tables
  dineInEnabled: boolean;
  takeawayEnabled: boolean;
  deliveryEnabled: boolean;
  tableCount: number;
  tablePrefix: string;
  minimumOrderAmount: number;
  allowOrderNotes: boolean;

  // Customer Experience
  thankYouMessage: string;
  whatsappNumber: string;
  googleMapsUrl: string;
  instagramHandle: string;
  enableFeedback: boolean;
}

export const DEFAULT_SETTINGS: RestaurantSettings = {
  name: "",
  tagline: "",
  email: "",
  phone: "",
  address: "",
  currency: "INR",
  timezone: "Asia/Kolkata",
  logoUrl: "",
  bannerUrl: "",
  primaryColor: "#8B5CF6",
  secondaryColor: "",
  accentColor: "#3B82F6",
  fontFamily: "Inter",
  menuLayout: "grid",
  showCalories: true,
  showPrepTime: true,
  showVegBadge: true,
  menuBgColor: "",
  menuTextColor: "",
  taxRate: 5,
  serviceCharge: 0,
  serviceChargeLabel: "Service Charge",
  autoAcceptOrders: false,
  estimatedPrepMins: 20,
  offlineMode: false,
  offlineModeMessage: "We're currently closed. Please check back later.",
  openingHours: DEFAULT_OPENING_SCHEDULE,
  notifyOnNewOrder: true,
  notifyOnLowStock: false,
  notifyEmail: "",
  maxDosaCount: 8,

  // Payments
  acceptsCash: true,
  acceptsCard: true,
  acceptsUpi: true,
  acceptsOnline: false,
  upiId: "",
  gstin: "",
  fssaiNumber: "",
  receiptFooter: "Thank you for dining with us!",
  showTaxBreakdown: true,

  // Order Types & Tables
  dineInEnabled: true,
  takeawayEnabled: true,
  deliveryEnabled: false,
  tableCount: 10,
  tablePrefix: "Table",
  minimumOrderAmount: 0,
  allowOrderNotes: true,

  // Customer Experience
  thankYouMessage: "Your order has been placed! We'll have it ready soon.",
  whatsappNumber: "",
  googleMapsUrl: "",
  instagramHandle: "",
  enableFeedback: false,
};

export const GOOGLE_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Nunito",
  "Source Sans Pro",
  "Raleway",
  "Playfair Display",
  "Merriweather",
  "DM Sans",
  "Plus Jakarta Sans",
  "Outfit",
  "Sora",
] as const;

export type GoogleFont = typeof GOOGLE_FONTS[number];

export const CURRENCIES = [
  { value: "INR", label: "INR - ₹ Indian Rupee" },
  { value: "USD", label: "USD - $ US Dollar" },
  { value: "EUR", label: "EUR - € Euro" },
  { value: "GBP", label: "GBP - £ British Pound" },
  { value: "AED", label: "AED - د.إ UAE Dirham" },
  { value: "SGD", label: "SGD - S$ Singapore Dollar" },
] as const;

export const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Pacific/Auckland",
] as const;
