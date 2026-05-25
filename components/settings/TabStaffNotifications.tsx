"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SettingsSection, SettingsRow } from "./SettingsShell";
import type { RestaurantSettings } from "@/types/settings";
import { Bell, Volume2, Mail } from "lucide-react";

interface Props {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}

export function TabStaffNotifications({ settings, onChange }: Props) {
  const set = <K extends keyof RestaurantSettings>(key: K, val: RestaurantSettings[K]) =>
    onChange({ [key]: val } as Partial<RestaurantSettings>);

  return (
    <div className="space-y-6">
      <SettingsSection>
        <SettingsRow
          label="New order alerts"
          description="Play a sound and show a notification when a new order is received"
        >
          <Switch
            checked={settings.notifyOnNewOrder}
            onCheckedChange={(v) => set("notifyOnNewOrder", v)}
          />
        </SettingsRow>
        <SettingsRow
          label="Low stock alerts"
          description="Notify when menu item availability is toggled off frequently"
        >
          <Switch
            checked={settings.notifyOnLowStock}
            onCheckedChange={(v) => set("notifyOnLowStock", v)}
          />
        </SettingsRow>
        <SettingsRow
          label="Notification email"
          description="Email address to receive daily summaries and critical alerts"
        >
          <Input
            type="email"
            className="max-w-xs"
            value={settings.notifyEmail}
            onChange={(e) => set("notifyEmail", e.target.value)}
            placeholder="manager@restaurant.com"
          />
        </SettingsRow>
      </SettingsSection>

      <div className="rounded-xl border border-border bg-surface-2 p-4">
        <div className="label-xs mb-3">Notification channels</div>
        <div className="space-y-2.5">
          {[
            { icon: Bell, label: "In-app notifications", desc: "Toast alerts in the dashboard", enabled: true },
            { icon: Volume2, label: "Sound alerts", desc: "Audio chime on new orders", enabled: settings.notifyOnNewOrder },
            { icon: Mail, label: "Email digest", desc: settings.notifyEmail ? `Sent to ${settings.notifyEmail}` : "No email configured", enabled: !!settings.notifyEmail },
          ].map(({ icon: Icon, label, desc, enabled }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-md border ${enabled ? "border-accent/30 bg-accent/10" : "border-border bg-surface-3"}`}>
                <Icon className={`h-3.5 w-3.5 ${enabled ? "text-accent" : "text-fg-subtle"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-fg">{label}</div>
                <div className="text-[11px] text-fg-subtle truncate">{desc}</div>
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${enabled ? "bg-success/15 text-success" : "bg-surface-3 text-fg-subtle"}`}>
                {enabled ? "Active" : "Off"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
