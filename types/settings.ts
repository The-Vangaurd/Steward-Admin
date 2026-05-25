// ─── Restaurant Settings Types ────────────────────────────────────────────────

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

  // Branding
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;

  // Menu Appearance
  menuLayout: "grid" | "list";
  showCalories: boolean;
  showPrepTime: boolean;
  showVegBadge: boolean;
  customCss: string;

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
  accentColor: "#3B82F6",
  fontFamily: "Inter",
  menuLayout: "grid",
  showCalories: true,
  showPrepTime: true,
  showVegBadge: true,
  customCss: "",
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
  { value: "INR", label: "INR — ₹ Indian Rupee" },
  { value: "USD", label: "USD — $ US Dollar" },
  { value: "EUR", label: "EUR — € Euro" },
  { value: "GBP", label: "GBP — £ British Pound" },
  { value: "AED", label: "AED — د.إ UAE Dirham" },
  { value: "SGD", label: "SGD — S$ Singapore Dollar" },
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
