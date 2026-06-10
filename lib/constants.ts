import { API_URL, WS_URL as CONFIG_WS_URL } from "./config/env";

export const API_BASE_URL = API_URL;
export const WS_URL = CONFIG_WS_URL;

// REMOVED: RESTAURANT_ID — slugs are now dynamic from the URL.
// Use the `slug` parameter from `useParams()` or route props instead.

// TAX_RATE is intentionally not exported as a hardcoded constant.
// Tax rates vary per restaurant and are served via GET /v1/menu/:slug/theme
// (theme.taxRate). Access it with: const { taxRate } = useRestaurant()
// This prevents cart totals from silently using the wrong rate when a
// restaurant has configured a custom tax rate in their settings.

export const SOCKET_EVENTS = {
  ORDER_STATUS_CHANGED: "order:status_changed",
  KITCHEN_ORDER_READY: "kitchen:order_ready",
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  ITEM_AVAILABILITY_CHANGED: "item:availability_changed",
} as const;

export const SOCKET_ROOMS = {
  restaurant: (slug: string) => `restaurant:${slug}`,
  order: (id: string) => `order:${id}`,
} as const;

export const QUERY_KEYS = {
  menu: (slug: string) => ["menu", slug] as const,
  theme: (slug: string) => ["theme", slug] as const,
  menuItem: (id: string) => ["menuItem", id] as const,
  order: (id: string) => ["order", id] as const,
} as const;
