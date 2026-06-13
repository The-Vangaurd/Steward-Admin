"use client";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { SettingsSection, SettingsRow } from "./SettingsShell";
import type { RestaurantSettings } from "@/types/settings";

interface Props {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}

export function TabOrderTypes({ settings, onChange }: Props) {
  const set = <K extends keyof RestaurantSettings>(key: K, val: RestaurantSettings[K]) =>
    onChange({ [key]: val } as Partial<RestaurantSettings>);

  return (
    <div className="space-y-6">

      {/* ── Order types ────────────────────────────────────────────────── */}
      <SettingsSection>
        <SettingsRow
          label="Dine-in"
          description="Customers order from their table using a QR code"
        >
          <Switch
            checked={settings.dineInEnabled}
            onCheckedChange={(v) => set("dineInEnabled", v)}
          />
        </SettingsRow>
        <SettingsRow
          label="Takeaway"
          description="Customers order ahead and pick up at the counter"
        >
          <Switch
            checked={settings.takeawayEnabled}
            onCheckedChange={(v) => set("takeawayEnabled", v)}
          />
        </SettingsRow>
        <SettingsRow
          label="Delivery"
          description="Customers order for home delivery (requires your own delivery setup)"
        >
          <Switch
            checked={settings.deliveryEnabled}
            onCheckedChange={(v) => set("deliveryEnabled", v)}
          />
        </SettingsRow>
      </SettingsSection>

      {/* ── Table configuration — only shown when dine-in is on ─────────── */}
      {settings.dineInEnabled && (
        <SettingsSection>
          <SettingsRow
            label="Number of tables"
            description="How many tables your restaurant has. Customers pick their table when ordering."
          >
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={500}
                className="w-24"
                value={settings.tableCount}
                onChange={(e) => set("tableCount", parseInt(e.target.value) || 1)}
              />
              <span className="text-[12px] text-fg-subtle">tables</span>
            </div>
          </SettingsRow>
          <SettingsRow
            label="Table label"
            description={`How tables are labelled on the menu — e.g. "${settings.tablePrefix} 4" or "Room 4"`}
          >
            <Input
              className="w-36"
              value={settings.tablePrefix}
              onChange={(e) => set("tablePrefix", e.target.value)}
              placeholder="Table"
            />
          </SettingsRow>
        </SettingsSection>
      )}

      {/* ── Order behaviour ────────────────────────────────────────────── */}
      <SettingsSection>
        <SettingsRow
          label="Minimum order amount"
          description="Orders below this value will be blocked. Set to 0 for no minimum."
        >
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-fg-muted">₹</span>
            <Input
              type="number"
              min={0}
              step={10}
              className="w-28"
              value={settings.minimumOrderAmount}
              onChange={(e) => set("minimumOrderAmount", parseFloat(e.target.value) || 0)}
            />
          </div>
        </SettingsRow>
        <SettingsRow
          label="Allow order notes"
          description="Let customers add a special instruction or note to their order"
        >
          <Switch
            checked={settings.allowOrderNotes}
            onCheckedChange={(v) => set("allowOrderNotes", v)}
          />
        </SettingsRow>
      </SettingsSection>

    </div>
  );
}
