"use client";

import { useState } from "react";
import { useKitchenOrders } from "@/hooks/useKitchenOrders";
import { OrderQueue } from "@/components/kitchen/orders/OrderQueue";
import { cn } from "@/lib/utils";
import type { KitchenType, OrderStatus } from "@/types";

type ActiveTab = "all" | OrderStatus | KitchenType;

interface Tab {
  id: ActiveTab;
  label: string;
  countFilter?: (status: OrderStatus) => boolean;
  color: string;
  activeColor: string;
  activeBg: string;
}

const TABS: Tab[] = [
  { id: "all",       label: "All",       color: "text-fg-muted",   activeColor: "text-fg",      activeBg: "bg-surface-3" },
  { id: "PENDING",   label: "Pending",   countFilter: (s) => s === "PENDING",   color: "text-warning/70",  activeColor: "text-warning",  activeBg: "bg-warning/10" },
  { id: "CONFIRMED", label: "Confirmed", countFilter: (s) => s === "CONFIRMED", color: "text-info/70",     activeColor: "text-info",     activeBg: "bg-info/10"    },
  { id: "PREPARING", label: "Preparing", countFilter: (s) => s === "PREPARING", color: "text-accent/70",   activeColor: "text-accent",   activeBg: "bg-accent/10"  },
  { id: "READY",     label: "Ready",     countFilter: (s) => s === "READY",     color: "text-success/70",  activeColor: "text-success",  activeBg: "bg-success/10" },
];

export default function KitchenQueuePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");
  const { data: orders } = useKitchenOrders();

  const getCount = (tab: Tab): number | null => {
    if (!orders || !tab.countFilter) return null;
    const n = orders.filter((o) => tab.countFilter!(o.status)).length;
    return n > 0 ? n : null;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden px-5 py-5 lg:px-6 lg:py-6">
      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 pb-4 overflow-x-auto flex-shrink-0">
        {TABS.map((tab) => {
          const count = getCount(tab);
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap flex-shrink-0 transition-all border",
                isActive
                  ? cn(tab.activeBg, tab.activeColor, "border-border-strong")
                  : cn("border-transparent", tab.color, "hover:bg-surface-2 hover:text-fg")
              )}
            >
              {tab.label}
              {count !== null && (
                <span className={cn(
                  "flex h-5 min-w-5 items-center justify-center rounded-full text-[11px] font-black px-1",
                  isActive ? cn(tab.activeBg, tab.activeColor) : "bg-surface-3 text-fg-subtle"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Queue */}
      <div className="flex-1 overflow-y-auto">
        <OrderQueue filter={activeTab} />
      </div>
    </div>
  );
}
