/**
 * Dosa Queue Utilities
 *
 * Pure, side-effect-free helpers for the Dosa Counter page.
 * Kept here (lib/) so they can be shared by future pages / tests.
 */

import type { KitchenOrder, KitchenOrderItem } from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Cumulative dosa quantity cap for the CURRENT section. */
export const CURRENT_DOSA_CAP = 8;

// ── Dosa detection ────────────────────────────────────────────────────────────

/**
 * Returns true if the item is dosa-related.
 *
 * Strategy (mirrors existing DosaGrillsColumn):
 *   1. Primary  — menuItem.kitchenType === "TIME_TAKING"
 *   2. Fallback — item name contains "dosa" (case-insensitive)
 *
 * Either signal is sufficient; both may be true for the same item.
 */
export function isDosaItem(item: KitchenOrderItem): boolean {
  const kitchenType = (item.menuItem as any)?.kitchenType as string | undefined;
  if (kitchenType === "TIME_TAKING") return true;
  return item.name.toLowerCase().includes("dosa");
}

/** Total dosa quantity across all items in a single order. */
export function dosaQuantityForOrder(order: KitchenOrder): number {
  return order.items
    .filter(isDosaItem)
    .reduce((sum, item) => sum + item.quantity, 0);
}

// ── Queue partitioning ────────────────────────────────────────────────────────

export interface DosaQueuePartition {
  current: KitchenOrder[];
  upcoming: KitchenOrder[];
}

/**
 * Partitions active orders into CURRENT / UPCOMING sections.
 *
 * Algorithm:
 *   1. Retain only orders that contain ≥1 dosa item.
 *   2. Sort oldest-first (createdAt ASC).
 *   3. Walk through the sorted list accumulating cumulative dosa qty.
 *   4. Push into CURRENT until cumulative qty reaches CURRENT_DOSA_CAP (8).
 *   5. All remaining orders go into UPCOMING.
 *
 * The cap is cumulative qty across orders, NOT number of orders.
 */
export function partitionDosaQueue(orders: KitchenOrder[]): DosaQueuePartition {
  // Filter to dosa-relevant orders only
  const dosaOrders = orders
    .filter((o) => dosaQuantityForOrder(o) > 0)
    .slice() // clone before mutating sort
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  const current: KitchenOrder[] = [];
  const upcoming: KitchenOrder[] = [];
  let cumulativeQty = 0;

  for (const order of dosaOrders) {
    const qty = dosaQuantityForOrder(order);

    if (cumulativeQty + qty <= CURRENT_DOSA_CAP) {
      current.push(order);
      cumulativeQty += qty;
    } else {
      upcoming.push(order);
    }
  }

  return { current, upcoming };
}

// ── Aggregation ───────────────────────────────────────────────────────────────

export interface AggregatedDosaItem {
  /** Display name — Title Cased */
  name: string;
  totalQuantity: number;
}

/**
 * Aggregates dosa items from a list of orders into a grouped summary.
 *
 * - Groups identical items by normalised (trimmed, lower-cased) name.
 * - Sums quantities across all matching items.
 * - Returns display name as Title Case.
 * - Sorts descending by quantity for kitchen ergonomics.
 */
export function aggregateDosaItems(
  orders: KitchenOrder[]
): AggregatedDosaItem[] {
  const map = new Map<string, { display: string; qty: number }>();

  for (const order of orders) {
    for (const item of order.items) {
      if (!isDosaItem(item)) continue;

      const key = item.name.trim().toLowerCase();
      const existing = map.get(key);

      if (existing) {
        existing.qty += item.quantity;
      } else {
        map.set(key, {
          display: toTitleCase(item.name.trim()),
          qty: item.quantity,
        });
      }
    }
  }

  return Array.from(map.values())
    .map(({ display, qty }) => ({ name: display, totalQuantity: qty }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity);
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function toTitleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
}
