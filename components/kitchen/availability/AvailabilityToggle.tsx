"use client";

import { useItemAvailability } from "@/hooks/useItemAvailability";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/types";

const KITCHEN_TYPE_LABEL: Record<string, string> = {
  MAIN:           "Main",
  TIME_TAKING:    "Time Taking",
  READY_TO_SERVE: "Ready to Serve",
};

interface AvailabilityToggleProps {
  item: MenuItem;
}

export function AvailabilityToggle({ item }: AvailabilityToggleProps) {
  const { mutate, isPending } = useItemAvailability();

  const handleToggle = () => {
    mutate({ itemId: item.id, input: { isAvailable: !item.isAvailable } });
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-xl px-4 py-3 border",
        "transition-all duration-200",
        item.isAvailable
          ? "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]"
          : "bg-[#D18B8B]/[0.05] border-[#D18B8B]/15"
      )}
    >
      {/* Item info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-medium",
            item.isAvailable ? "text-white/90" : "text-white/35 line-through"
          )}>
            {item.name}
          </span>
          {item.isPopular && (
            <span className="text-[#C8B6E2] text-xs flex-shrink-0">★</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-white/30">
            {KITCHEN_TYPE_LABEL[item.kitchenType] ?? item.kitchenType}
          </span>
        </div>
      </div>

      {/* Toggle + status */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={cn(
          "text-xs font-semibold",
          item.isAvailable ? "text-[#92B9A5]" : "text-[#D18B8B]"
        )}>
          {item.isAvailable ? "In Stock" : "Out"}
        </span>

        {/* Custom toggle — large touch target, KDS-styled */}
        <button
          role="switch"
          aria-checked={item.isAvailable}
          aria-label={`Toggle ${item.name} availability`}
          disabled={isPending}
          onClick={handleToggle}
          className={cn(
            "relative inline-flex h-7 w-12 items-center rounded-full",
            "transition-colors duration-200 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8B6E2]/40",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            item.isAvailable
              ? "bg-[#92B9A5]"
              : "bg-white/10"
          )}
        >
          <span
            className={cn(
              "block h-5 w-5 rounded-full bg-white shadow-md",
              "transition-transform duration-200 ease-out",
              item.isAvailable ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>
    </div>
  );
}
