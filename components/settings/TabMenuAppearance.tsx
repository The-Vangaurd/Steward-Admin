"use client";

import { SettingsSection, SettingsRow } from "./SettingsShell";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RestaurantSettings } from "@/types/settings";

interface Props {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}

export function TabMenuAppearance({ settings, onChange }: Props) {
  const set = <K extends keyof RestaurantSettings>(key: K, val: RestaurantSettings[K]) =>
    onChange({ [key]: val } as Partial<RestaurantSettings>);

  return (
    <div className="space-y-6">
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

      <SettingsSection>
        <SettingsRow
          label="Custom CSS"
          description="Advanced: injected into the customer-facing menu page. Use with caution."
        >
          <div className="space-y-1.5">
            <textarea
              className="w-full h-48 font-mono text-[12px] rounded-md border border-border bg-surface-3 p-3 text-fg placeholder:text-fg-subtle resize-y focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder={`/* Example: override card radius */\n.menu-card {\n  border-radius: 8px;\n}`}
              value={settings.customCss}
              onChange={(e) => set("customCss", e.target.value)}
              spellCheck={false}
            />
            <p className="text-[11px] text-fg-subtle">
              CSS is sanitised before injection. Dangerous properties are stripped automatically.
            </p>
          </div>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
