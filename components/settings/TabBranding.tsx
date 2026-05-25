"use client";

import { SettingsSection, SettingsRow } from "./SettingsShell";
import { ImageUpload } from "./ImageUpload";
import { ColorPicker } from "./ColorPicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RestaurantSettings } from "@/types/settings";
import { GOOGLE_FONTS } from "@/types/settings";

interface Props {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}

export function TabBranding({ settings, onChange }: Props) {
  const set = <K extends keyof RestaurantSettings>(key: K, val: RestaurantSettings[K]) =>
    onChange({ [key]: val } as Partial<RestaurantSettings>);

  return (
    <div className="space-y-6">
      <SettingsSection>
        <SettingsRow label="Logo" description="Square image, PNG or WebP recommended. Shown in sidebar and receipts.">
          <div className="w-32">
            <ImageUpload
              value={settings.logoUrl}
              onChange={(url) => set("logoUrl", url)}
              type="logo"
              label="Logo"
              aspectRatio="aspect-square"
            />
          </div>
        </SettingsRow>
        <SettingsRow label="Banner" description="Wide banner image for your customer-facing menu. 3:1 ratio recommended.">
          <div className="max-w-sm">
            <ImageUpload
              value={settings.bannerUrl}
              onChange={(url) => set("bannerUrl", url)}
              type="banner"
              label="Banner"
              aspectRatio="aspect-[3/1]"
            />
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection>
        <SettingsRow label="Primary colour" description="Main brand colour used for buttons and highlights">
          <ColorPicker value={settings.primaryColor} onChange={(c) => set("primaryColor", c)} />
        </SettingsRow>
        <SettingsRow label="Accent colour" description="Secondary colour for badges and indicators">
          <ColorPicker value={settings.accentColor} onChange={(c) => set("accentColor", c)} />
        </SettingsRow>
        <SettingsRow label="Font family" description="Applied to customer-facing menus and receipts">
          <Select value={settings.fontFamily} onValueChange={(v) => set("fontFamily", v)}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOOGLE_FONTS.map((f) => (
                <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsSection>

      {/* Live preview */}
      <div className="rounded-xl border border-border bg-surface-2 p-5">
        <div className="label-xs mb-3">Live preview</div>
        <div
          className="rounded-lg overflow-hidden border border-border"
          style={{ fontFamily: settings.fontFamily }}
        >
          {settings.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.bannerUrl} alt="Banner" className="w-full h-24 object-cover" />
          ) : (
            <div className="h-24 flex items-center justify-center" style={{ background: settings.primaryColor + "22" }}>
              <span className="text-[12px]" style={{ color: settings.primaryColor }}>Banner area</span>
            </div>
          )}
          <div className="p-4 bg-surface">
            <div className="flex items-center gap-3 mb-3">
              {settings.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-cover border border-border" />
              ) : (
                <div className="h-10 w-10 rounded-lg flex items-center justify-center border border-border" style={{ background: settings.primaryColor }}>
                  <span className="text-white text-[13px] font-bold">{(settings.name || "R")[0]}</span>
                </div>
              )}
              <div>
                <div className="text-[14px] font-semibold text-fg">{settings.name || "Restaurant Name"}</div>
                <div className="text-[11px] text-fg-subtle">{settings.tagline || "Your tagline here"}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white" style={{ background: settings.primaryColor }}>
                Dine-in
              </span>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white" style={{ background: settings.accentColor }}>
                Takeaway
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
