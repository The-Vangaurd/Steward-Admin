"use client";

import { SettingsSection, SettingsRow } from "./SettingsShell";
import { ImageUpload } from "./ImageUpload";
import { ColorPicker } from "./ColorPicker";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RestaurantSettings } from "@/types/settings";
import { GOOGLE_FONTS } from "@/types/settings";

interface Props {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}

export function TabTheme({ settings, onChange }: Props) {
  const set = <K extends keyof RestaurantSettings>(key: K, val: RestaurantSettings[K]) =>
    onChange({ [key]: val } as Partial<RestaurantSettings>);

  return (
    <div className="space-y-6">
      {/* ── Section 1: Visual Identity ───────────────────────────────────────── */}
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

        <SettingsRow label="Primary colour" description="Used for CTA buttons and active states">
          <ColorPicker value={settings.primaryColor} onChange={(c) => set("primaryColor", c)} />
        </SettingsRow>

        <SettingsRow label="Accent colour" description="Used for badges and highlights">
          <ColorPicker value={settings.accentColor} onChange={(c) => set("accentColor", c)} />
        </SettingsRow>

        <SettingsRow label="Menu background" description="Background tint — subtle colour behind your menu page (leave blank for default dark)">
          <ColorPicker value={settings.menuBgColor ?? ""} onChange={(c) => set("menuBgColor", c)} />
        </SettingsRow>

        <SettingsRow label="Menu text" description="Text tint — colour for headings and labels in your menu">
          <ColorPicker value={settings.menuTextColor ?? ""} onChange={(c) => set("menuTextColor", c)} />
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

      {/* ── Section 2: Display Options ───────────────────────────────────────── */}
      <SettingsSection>
        <SettingsRow label="Menu layout" description="How items are displayed to customers">
          <div className="flex gap-2">
            {(["grid", "list"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => set("menuLayout", l)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border px-4 py-3 text-[12px] font-medium transition-colors",
                  settings.menuLayout === l
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface-2 text-fg-muted hover:border-border-strong hover:text-fg"
                )}
              >
                {l === "grid" ? <LayoutGrid className="h-5 w-5" /> : <List className="h-5 w-5" />}
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </button>
            ))}
          </div>
        </SettingsRow>

        <SettingsRow label="Show calories" description="Display calorie count on menu items">
          <Switch checked={settings.showCalories} onCheckedChange={(v) => set("showCalories", v)} />
        </SettingsRow>

        <SettingsRow label="Show prep time" description="Display estimated preparation time">
          <Switch checked={settings.showPrepTime} onCheckedChange={(v) => set("showPrepTime", v)} />
        </SettingsRow>

        <SettingsRow label="Show veg/non-veg badge" description="Indian FSSAI-style green/red dot indicators">
          <Switch checked={settings.showVegBadge} onCheckedChange={(v) => set("showVegBadge", v)} />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
