"use client";

import { cn } from "@/lib/utils";
import { OrderCard } from "@/components/kitchen/orders/OrderCard";
import { aggregateDosaItems, CURRENT_DOSA_CAP } from "@/lib/dosaQueue";
import type { KitchenOrder } from "@/types";
import type { AggregatedDosaItem } from "@/lib/dosaQueue";

// ── Colour tokens per section ─────────────────────────────────────────────────

const SECTION_THEME = {
  current: {
    accent:      "#D9B872",      // warm gold
    bg:          "bg-[#D9B872]/8",
    border:      "border-[#D9B872]/20",
    dot:         "bg-[#D9B872]",
    badge:       "bg-[#D9B872]/15 text-[#D9B872]",
    headerText:  "text-[#D9B872]",
    qtyText:     "text-[#D9B872]",
    itemBg:      "bg-[#D9B872]/5 border-[#D9B872]/10",
  },
  upcoming: {
    accent:      "#9BAED2",      // soft blue
    bg:          "bg-white/[0.02]",
    border:      "border-white/[0.08]",
    dot:         "bg-white/40",
    badge:       "bg-white/[0.08] text-white/50",
    headerText:  "text-white/60",
    qtyText:     "text-white/70",
    itemBg:      "bg-white/[0.03] border-white/[0.06]",
  },
} as const;

// ── Aggregation summary strip ─────────────────────────────────────────────────

function SummaryStrip({
  items,
  theme,
}: {
  items: AggregatedDosaItem[];
  theme: typeof SECTION_THEME["current"];
}) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        theme.bg,
        theme.border
      )}
    >
      {/* Strip header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", theme.dot)} />
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-widest",
            theme.headerText
          )}
        >
          Prep Summary
        </span>
      </div>

      {/* Item rows — large, easy to scan at a glance */}
      <div className="grid grid-cols-1 gap-2">
        {items.map((item) => (
          <div
            key={item.name}
            className={cn(
              "flex items-center justify-between rounded-lg border px-4 py-3",
              theme.itemBg
            )}
          >
            <span className="text-sm font-semibold text-white/80 truncate pr-3">
              {item.name}
            </span>
            <div className="flex items-baseline gap-1.5 flex-shrink-0">
              <span className={cn("text-3xl font-black leading-none tabular-nums", theme.qtyText)}>
                {item.totalQuantity}
              </span>
              <span className="text-xs text-white/30 font-medium">pcs</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section component ─────────────────────────────────────────────────────────

interface DosaOrderSectionProps {
  /** "current" shows the first ≤8-dosa-qty batch; "upcoming" shows the rest. */
  variant: "current" | "upcoming";
  orders: KitchenOrder[];
}

/**
 * DosaOrderSection
 *
 * Renders a labelled section (CURRENT or UPCOMING) that contains:
 *   1. A prominent grouped dosa summary (aggregated quantities).
 *   2. The original individual order cards beneath it.
 *
 * Uses existing OrderCard — no duplication of card logic.
 */
export function DosaOrderSection({ variant, orders }: DosaOrderSectionProps) {
  const theme = SECTION_THEME[variant];
  const label = variant === "current" ? "Current" : "Upcoming";
  const aggregated = aggregateDosaItems(orders);

  const totalQty = aggregated.reduce((s, i) => s + i.totalQuantity, 0);

  // Cap label for current section
  const capHint =
    variant === "current"
      ? `${totalQty} / ${CURRENT_DOSA_CAP} dosas`
      : `${orders.length} order${orders.length !== 1 ? "s" : ""} queued`;

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              variant === "current" ? "bg-[#D9B872]" : "bg-white/30"
            )}
          />
          <h3
            className={cn(
              "text-xs font-black uppercase tracking-[0.15em]",
              variant === "current" ? "text-[#D9B872]" : "text-white/50"
            )}
          >
            {label}
          </h3>
        </div>
        <span
          className={cn(
            "px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide",
            theme.badge
          )}
        >
          {capHint}
        </span>
      </div>

      {/* Aggregation summary */}
      {aggregated.length > 0 && (
        <SummaryStrip items={aggregated} theme={theme} />
      )}

      {/* Original order cards */}
      {orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <EmptySection variant={variant} />
      )}
    </section>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptySection({ variant }: { variant: "current" | "upcoming" }) {
  const text =
    variant === "current"
      ? "No dosa orders in queue"
      : "No upcoming dosa orders";

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.01] py-10 text-center">
      <span className="text-2xl">🫓</span>
      <p className="text-xs text-white/30">{text}</p>
    </div>
  );
}
