"use client";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { SettingsSection, SettingsRow } from "./SettingsShell";
import type { RestaurantSettings } from "@/types/settings";

interface Props {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}

export function TabPayments({ settings, onChange }: Props) {
  const set = <K extends keyof RestaurantSettings>(key: K, val: RestaurantSettings[K]) =>
    onChange({ [key]: val } as Partial<RestaurantSettings>);

  return (
    <div className="space-y-6">

      {/* ── Accepted payment methods ────────────────────────────────────── */}
      <SettingsSection>
        <SettingsRow
          label="Cash"
          description="Accept cash payments at the counter"
        >
          <Switch
            checked={settings.acceptsCash}
            onCheckedChange={(v) => set("acceptsCash", v)}
          />
        </SettingsRow>
        <SettingsRow
          label="Card (POS)"
          description="Accept debit / credit card via your POS machine"
        >
          <Switch
            checked={settings.acceptsCard}
            onCheckedChange={(v) => set("acceptsCard", v)}
          />
        </SettingsRow>
        <SettingsRow
          label="UPI"
          description="Accept UPI payments (PhonePe, Google Pay, Paytm, etc.)"
        >
          <Switch
            checked={settings.acceptsUpi}
            onCheckedChange={(v) => set("acceptsUpi", v)}
          />
        </SettingsRow>
        {settings.acceptsUpi && (
          <SettingsRow
            label="UPI ID"
            description="Displayed to customers at checkout so they can scan or pay directly"
          >
            <Input
              className="max-w-xs"
              value={settings.upiId}
              onChange={(e) => set("upiId", e.target.value)}
              placeholder="yourname@upi"
            />
          </SettingsRow>
        )}
        <SettingsRow
          label="Online payments"
          description="Accept payments via payment gateway (requires gateway integration)"
        >
          <Switch
            checked={settings.acceptsOnline}
            onCheckedChange={(v) => set("acceptsOnline", v)}
          />
        </SettingsRow>
      </SettingsSection>

      {/* ── Legal / tax IDs ────────────────────────────────────────────── */}
      <SettingsSection>
        <SettingsRow
          label="GSTIN"
          description="Your GST registration number — printed on every receipt"
        >
          <Input
            className="max-w-xs"
            value={settings.gstin}
            onChange={(e) => set("gstin", e.target.value.toUpperCase())}
            placeholder="22AAAAA0000A1Z5"
            maxLength={15}
          />
        </SettingsRow>
        <SettingsRow
          label="FSSAI licence number"
          description="Food safety licence number — printed on receipts and menu"
        >
          <Input
            className="max-w-xs"
            value={settings.fssaiNumber}
            onChange={(e) => set("fssaiNumber", e.target.value)}
            placeholder="10000000000000"
            maxLength={14}
          />
        </SettingsRow>
      </SettingsSection>

      {/* ── Receipt settings ───────────────────────────────────────────── */}
      <SettingsSection>
        <SettingsRow
          label="Receipt footer"
          description="Message printed at the bottom of every receipt"
        >
          <Input
            value={settings.receiptFooter}
            onChange={(e) => set("receiptFooter", e.target.value)}
            placeholder="Thank you for dining with us!"
          />
        </SettingsRow>
        <SettingsRow
          label="Show tax breakdown"
          description="Show CGST / SGST / IGST line items on receipt. Turn off to show only the total tax amount."
        >
          <Switch
            checked={settings.showTaxBreakdown}
            onCheckedChange={(v) => set("showTaxBreakdown", v)}
          />
        </SettingsRow>
      </SettingsSection>

    </div>
  );
}
