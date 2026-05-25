"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsSection, SettingsRow } from "./SettingsShell";
import type { RestaurantSettings } from "@/types/settings";
import { CURRENCIES, TIMEZONES } from "@/types/settings";

interface Props {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}

export function TabGeneral({ settings, onChange }: Props) {
  const set = <K extends keyof RestaurantSettings>(key: K, val: RestaurantSettings[K]) =>
    onChange({ [key]: val } as Partial<RestaurantSettings>);

  return (
    <div className="space-y-6">
      <SettingsSection>
        <SettingsRow label="Restaurant name" description="Displayed to customers across the platform">
          <Input value={settings.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. SpiceOS Restaurant" />
        </SettingsRow>
        <SettingsRow label="Tagline" description="Short description shown on menu and receipts">
          <Input value={settings.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="e.g. Authentic flavours since 2010" />
        </SettingsRow>
        <SettingsRow label="Email" description="For order confirmations and notifications">
          <Input type="email" value={settings.email} onChange={(e) => set("email", e.target.value)} placeholder="restaurant@example.com" />
        </SettingsRow>
        <SettingsRow label="Phone" description="Customer-facing contact number">
          <Input value={settings.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" />
        </SettingsRow>
        <SettingsRow label="Address" description="Full address for receipts and delivery">
          <textarea
            className="w-full min-h-[72px] rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] text-fg placeholder:text-fg-subtle resize-none focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={settings.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="123 Main Street, Chennai, Tamil Nadu 600001"
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection>
        <SettingsRow label="Currency" description="Used for all pricing and invoices">
          <Select value={settings.currency} onValueChange={(v) => set("currency", v)}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label="Timezone" description="Used for scheduling and opening hours">
          <Select value={settings.timezone} onValueChange={(v) => set("timezone", v)}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>{tz}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
