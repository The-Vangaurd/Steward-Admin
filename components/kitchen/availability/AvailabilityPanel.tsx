"use client";

import { useState, useMemo } from "react";
import { Search, RefreshCw, AlertCircle } from "lucide-react";
import { AvailabilityToggle } from "./AvailabilityToggle";
import { useMenuItems } from "@/hooks/useItemAvailability";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/types";

type CategoryGroup = { id: string; name: string; items: MenuItem[] };

export function AvailabilityPanel() {
  const [search, setSearch] = useState("");
  const { data: items, isLoading, isError, refetch, isFetching } = useMenuItems();

  const groups = useMemo<CategoryGroup[]>(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? items.filter((item) => item.name.toLowerCase().includes(q))
      : items;
    const map = new Map<string, CategoryGroup>();
    for (const item of filtered) {
      const catId = item.category?.id ?? "uncategorised";
      const catName = item.category?.name ?? "Uncategorised";
      if (!map.has(catId)) map.set(catId, { id: catId, name: catName, items: [] });
      map.get(catId)!.items.push(item);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [items, search]);

  const totalUnavailable = items?.filter((i) => !i.isAvailable).length ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="kds-skeleton h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D18B8B]/10 border border-[#D18B8B]/15">
          <AlertCircle className="h-7 w-7 text-[#D18B8B]" />
        </div>
        <p className="text-white/45">Failed to load menu items</p>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-sm text-white/70 border border-white/[0.08] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
          <input
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "h-11 w-full rounded-xl pl-9 pr-3 text-sm",
              "bg-white/[0.05] border border-white/[0.08]",
              "text-white placeholder:text-white/25",
              "focus:outline-none focus:border-[#C8B6E2]/35",
              "transition-colors duration-150"
            )}
          />
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          title="Refresh"
          className="h-11 w-11 flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white/45 hover:text-white/70 transition-colors disabled:opacity-50 flex-shrink-0"
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
        </button>
      </div>

      {/* Unavailable alert */}
      {totalUnavailable > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-[#D18B8B]/8 border border-[#D18B8B]/15 px-4 py-3 text-sm text-[#D18B8B] animate-kds-slide">
          <span className="font-semibold">{totalUnavailable}</span>
          <span className="text-[#D18B8B]/80">
            item{totalUnavailable !== 1 ? "s" : ""} currently unavailable
          </span>
        </div>
      )}

      {/* Item groups */}
      {groups.length === 0 ? (
        <p className="text-center text-white/30 py-16 text-sm">
          {search ? "No items match your search" : "No menu items found"}
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.id}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-xs font-bold uppercase tracking-widest text-white/30">
                  {group.name}
                </span>
                <span className="text-xs text-white/20">({group.items.length})</span>
              </div>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <AvailabilityToggle key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
