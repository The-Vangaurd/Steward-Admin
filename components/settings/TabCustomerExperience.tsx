"use client";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { SettingsSection, SettingsRow } from "./SettingsShell";
import type { RestaurantSettings } from "@/types/settings";

interface Props {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}

export function TabCustomerExperience({ settings, onChange }: Props) {
  const set = <K extends keyof RestaurantSettings>(key: K, val: RestaurantSettings[K]) =>
    onChange({ [key]: val } as Partial<RestaurantSettings>);

  return (
    <div className="space-y-6">

      {/* ── Post-order messaging ──────────────────────────────────────── */}
      <SettingsSection>
        <SettingsRow
          label="Thank-you message"
          description="Shown to the customer immediately after they place an order"
        >
          <Input
            value={settings.thankYouMessage}
            onChange={(e) => set("thankYouMessage", e.target.value)}
            placeholder="Your order has been placed! We'll have it ready soon."
          />
        </SettingsRow>
        <SettingsRow
          label="Enable customer feedback"
          description="Ask customers to rate their experience after their order is completed"
        >
          <Switch
            checked={settings.enableFeedback}
            onCheckedChange={(v) => set("enableFeedback", v)}
          />
        </SettingsRow>
      </SettingsSection>

      {/* ── Contact & social ─────────────────────────────────────────── */}
      <SettingsSection>
        <SettingsRow
          label="WhatsApp support number"
          description="Customers tap this to message you directly for help. Include country code — e.g. +91 98765 43210"
        >
          <Input
            className="max-w-xs"
            value={settings.whatsappNumber}
            onChange={(e) => set("whatsappNumber", e.target.value)}
            placeholder="+91 98765 43210"
          />
        </SettingsRow>
        <SettingsRow
          label="Google Maps link"
          description="Link to your restaurant on Google Maps — shown on the customer menu"
        >
          <Input
            className="max-w-sm"
            value={settings.googleMapsUrl}
            onChange={(e) => set("googleMapsUrl", e.target.value)}
            placeholder="https://maps.google.com/?q=..."
          />
        </SettingsRow>
        <SettingsRow
          label="Instagram handle"
          description="Your Instagram username without @. Shown as a link on the menu footer."
        >
          <div className="flex items-center gap-1.5 max-w-xs">
            <span className="text-[13px] text-fg-muted shrink-0">@</span>
            <Input
              value={settings.instagramHandle}
              onChange={(e) => set("instagramHandle", e.target.value.replace("@", ""))}
              placeholder="yourrestaurant"
            />
          </div>
        </SettingsRow>
      </SettingsSection>

    </div>
  );
}
