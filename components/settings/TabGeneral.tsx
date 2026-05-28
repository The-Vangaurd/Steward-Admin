"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsSection, SettingsRow } from "./SettingsShell";
import type { RestaurantSettings } from "@/types/settings";
import { CURRENCIES, TIMEZONES } from "@/types/settings";

// ── Menu link helpers ─────────────────────────────────────────────────────────

const MENU_BASE_URL =
  process.env.NEXT_PUBLIC_MENU_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined"
    ? window.location.origin.replace(":3000", ":3001") // local dev fallback
    : "");

function MenuLinkRow({ slug }: { slug?: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!slug) {
    return (
      <SettingsRow
        label="Customer menu link"
        description="Share this URL with customers to let them browse and order"
      >
        <p className="text-[12px] text-fg-subtle italic">
          No slug set — save your restaurant name to generate a link.
        </p>
      </SettingsRow>
    );
  }

  const menuUrl = `${MENU_BASE_URL}/menu/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const el = document.createElement("textarea");
      el.value = menuUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <SettingsRow
      label="Customer menu link"
      description="Share this URL with customers to let them browse and order"
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2">
          <span className="text-[12px] text-fg-subtle truncate flex-1 font-mono select-all">
            {menuUrl}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy link"
          className="shrink-0 flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-[12px] font-medium text-fg hover:bg-surface-2 transition-colors"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
        <a
          href={menuUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Open menu"
          className="shrink-0 flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-[12px] font-medium text-fg hover:bg-surface-2 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open
        </a>
      </div>
    </SettingsRow>
  );
}

interface Props {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}

export function TabGeneral({ settings, onChange }: Props) {
  const set = <K extends keyof RestaurantSettings>(key: K, val: RestaurantSettings[K]) =>
    onChange({ [key]: val } as Partial<RestaurantSettings>);

  return (
    <div className="space-y-6">

      {/* ── Menu link — read-only, always visible ── */}
      <SettingsSection>
        <MenuLinkRow slug={settings.slug} />
      </SettingsSection>

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