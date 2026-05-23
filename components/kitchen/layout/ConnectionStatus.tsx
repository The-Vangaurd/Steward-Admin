"use client";

import { useSettingsStore } from "@/stores/settings.store";
import { cn } from "@/lib/utils";

export function ConnectionStatus() {
  const { wsConnected } = useSettingsStore();

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide",
        "border transition-all duration-500",
        wsConnected
          ? "bg-[#92B9A5]/8 border-[#92B9A5]/20 text-[#92B9A5]"
          : "bg-[#D18B8B]/8 border-[#D18B8B]/20 text-[#D18B8B]"
      )}
      title={wsConnected ? "Connected — live updates active" : "Disconnected — reconnecting…"}
    >
      <span
        className={cn(
          "block h-1.5 w-1.5 rounded-full flex-shrink-0",
          wsConnected
            ? "bg-[#92B9A5] animate-kds-dot-pulse"
            : "bg-[#D18B8B] animate-pulse"
        )}
      />
      <span className="hidden sm:inline">
        {wsConnected ? "Live" : "Offline"}
      </span>
    </div>
  );
}
