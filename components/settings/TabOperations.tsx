"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SettingsSection, SettingsRow } from "./SettingsShell";
import type { RestaurantSettings, DayOfWeek } from "@/types/settings";
import { DAY_LABELS } from "@/types/settings";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface Props {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}

const DAYS: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export function TabOperations({ settings, onChange }: Props) {
  const set = <K extends keyof RestaurantSettings>(key: K, val: RestaurantSettings[K]) =>
    onChange({ [key]: val } as Partial<RestaurantSettings>);

  const patchHours = (day: DayOfWeek, patch: Partial<typeof settings.openingHours[DayOfWeek]>) => {
    onChange({
      openingHours: {
        ...settings.openingHours,
        [day]: { ...settings.openingHours[day], ...patch },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Pricing */}
      <SettingsSection>
        <SettingsRow label="Tax rate (%)" description="Applied to all orders (e.g. GST)">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              step={0.5}
              className="w-24"
              value={settings.taxRate}
              onChange={(e) => set("taxRate", parseFloat(e.target.value) || 0)}
            />
            <span className="text-[12px] text-fg-subtle">%</span>
          </div>
        </SettingsRow>
        <SettingsRow label="Service charge (%)" description="Optional service charge added to bill">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              step={0.5}
              className="w-24"
              value={settings.serviceCharge}
              onChange={(e) => set("serviceCharge", parseFloat(e.target.value) || 0)}
            />
            <span className="text-[12px] text-fg-subtle">%</span>
          </div>
        </SettingsRow>
        <SettingsRow label="Service charge label" description="Shown on receipt line item">
          <Input
            className="w-48"
            value={settings.serviceChargeLabel}
            onChange={(e) => set("serviceChargeLabel", e.target.value)}
            placeholder="Service Charge"
          />
        </SettingsRow>
      </SettingsSection>

      {/* Order settings */}
      <SettingsSection>
        <SettingsRow label="Auto-accept orders" description="Automatically move new orders to Confirmed without manual approval">
          <Switch checked={settings.autoAcceptOrders} onCheckedChange={(v) => set("autoAcceptOrders", v)} />
        </SettingsRow>
        <SettingsRow label="Default prep time" description="Estimated preparation time shown to customers (minutes)">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={120}
              className="w-24"
              value={settings.estimatedPrepMins}
              onChange={(e) => set("estimatedPrepMins", parseInt(e.target.value) || 20)}
            />
            <span className="text-[12px] text-fg-subtle">min</span>
          </div>
        </SettingsRow>
      </SettingsSection>

      {/* Offline mode */}
      <SettingsSection>
        <SettingsRow label="Offline mode" description="Pause all incoming orders and show a custom message to customers">
          <Switch
            checked={settings.offlineMode}
            onCheckedChange={(v) => set("offlineMode", v)}
          />
        </SettingsRow>
        {settings.offlineMode && (
          <SettingsRow label="Offline message" description="Message displayed on customer-facing menu when offline">
            <Input
              value={settings.offlineModeMessage}
              onChange={(e) => set("offlineModeMessage", e.target.value)}
              placeholder="We're currently closed. Please check back later."
            />
          </SettingsRow>
        )}
      </SettingsSection>

      {/* Opening Hours */}
      <div>
        <div className="label-xs mb-3">Opening hours</div>
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          {DAYS.map((day, i) => {
            const h = settings.openingHours[day];
            return (
              <div
                key={day}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3",
                  i < DAYS.length - 1 && "border-b border-border"
                )}
              >
                <div className="w-24 shrink-0">
                  <span className={cn("text-[13px] font-medium", h.closed ? "text-fg-subtle" : "text-fg")}>
                    {DAY_LABELS[day]}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-1">
                  {h.closed ? (
                    <span className="text-[12px] text-fg-subtle italic">Closed</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={h.open}
                        onChange={(e) => patchHours(day, { open: e.target.value })}
                        className="h-8 rounded-md border border-border bg-surface-2 px-2 text-[12px] text-fg focus:border-accent focus:outline-none"
                      />
                      <span className="text-[11px] text-fg-subtle">to</span>
                      <input
                        type="time"
                        value={h.close}
                        onChange={(e) => patchHours(day, { close: e.target.value })}
                        className="h-8 rounded-md border border-border bg-surface-2 px-2 text-[12px] text-fg focus:border-accent focus:outline-none"
                      />
                    </div>
                  )}
                </div>
                <Switch
                  checked={!h.closed}
                  onCheckedChange={(v) => patchHours(day, { closed: !v })}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Shifts management */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="label-xs">Shift Management</div>
          <a
            href="/settings?tab=shifts"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-accent hover:text-accent/80 transition-colors"
          >
            Manage shifts
            <ChevronRight className="h-3 w-3" />
          </a>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-[12px] text-fg-subtle">
            Define weekly shifts to track kitchen throughput and staff scheduling.
            Shifts appear on the kitchen board as contextual labels.
          </p>
        </div>
      </div>
    </div>
  );
}
