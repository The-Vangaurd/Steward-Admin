"use client";
// restaurant-code section reads from auth store (not settings API — code is set by backend at registration)

import { useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import {
  Copy, Check, ExternalLink, Download, QrCode, Link2, Key,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsSection, SettingsRow } from "./SettingsShell";
import type { RestaurantSettings } from "@/types/settings";
import { CURRENCIES, TIMEZONES } from "@/types/settings";

import { MENU_URL } from "@/lib/config/env";

function getMenuBaseUrl(): string {
  return MENU_URL.replace(/\/$/, "");
}

// ─── QR code URL ──────────────────────────────────────────────────────────────
// Uses qrserver.com — free, no API key, no npm package needed.

function qrImageUrl(data: string, size = 240): string {
  return (
    `https://api.qrserver.com/v1/create-qr-code/` +
    `?size=${size}x${size}&data=${encodeURIComponent(data)}&format=png&margin=2`
  );
}

// ─── MenuQrSection ────────────────────────────────────────────────────────────

interface MenuQrSectionProps {
  slug?: string | null;
  restaurantName?: string;
}

function MenuQrSection({ slug, restaurantName }: MenuQrSectionProps) {
  const [linkCopied, setLinkCopied]   = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!slug) {
    return (
      <div className="rounded-xl border border-border bg-surface px-5 py-5">
        <div className="flex items-center gap-2 mb-1">
          <QrCode className="h-4 w-4 text-fg-subtle" />
          <span className="text-[13px] font-semibold text-fg">Menu link & QR code</span>
        </div>
        <p className="text-[12px] text-fg-subtle">
          Your menu link and QR code will appear here once your restaurant profile is saved.
        </p>
      </div>
    );
  }

  const menuUrl  = `${getMenuBaseUrl()}/menu/${slug}`;
  const qrUrl    = qrImageUrl(menuUrl, 240);
  const filename = `${slug}-menu-qr.png`;

  // ── Copy link ──────────────────────────────────────────────────────────────
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = menuUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // ── Download QR ────────────────────────────────────────────────────────────
  // Fetch as blob so the browser saves it as a file instead of opening it.
  const handleDownloadQr = async () => {
    setDownloading(true);
    try {
      const res  = await fetch(qrUrl);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(qrUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-5">

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <QrCode className="h-4 w-4 text-fg-subtle" />
        <span className="text-[13px] font-semibold text-fg">Menu link & QR code</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">

        {/* ── QR image ── */}
        <div className="shrink-0 flex flex-col items-center gap-3">
          <img
            src={qrUrl}
            alt={`QR code for ${restaurantName ?? slug} menu`}
            width={140}
            height={140}
            className="rounded-lg border border-border bg-white p-2"
          />
          <button
            type="button"
            onClick={handleDownloadQr}
            disabled={downloading}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-[12px] font-medium text-fg hover:bg-surface-2 transition-colors disabled:opacity-50 w-full justify-center"
          >
            <Download className="h-3.5 w-3.5" />
            {downloading ? "Downloading…" : "Download QR"}
          </button>
        </div>

        {/* ── Link + instructions ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">

          <p className="text-[12px] text-fg-subtle">
            Share this link or print the QR code — customers scan it to browse
            your menu and place orders directly from their phone.
          </p>

          {/* URL row */}
          <div>
            <div className="text-[11px] font-medium text-fg-subtle uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Link2 className="h-3 w-3" />
              Your menu URL
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 rounded-md border border-border bg-surface-2 px-3 py-2">
                <span className="text-[12px] text-fg font-mono truncate block select-all">
                  {menuUrl}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                title="Copy link"
                className="shrink-0 flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-[12px] font-medium text-fg hover:bg-surface-2 transition-colors"
              >
                {linkCopied
                  ? <Check className="h-3.5 w-3.5 text-green-500" />
                  : <Copy className="h-3.5 w-3.5" />}
                {linkCopied ? "Copied!" : "Copy"}
              </button>
              <a
                href={menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open menu in new tab"
                className="shrink-0 flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-[12px] font-medium text-fg hover:bg-surface-2 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open
              </a>
            </div>
          </div>

          {/* Usage tips */}
          <div className="rounded-lg bg-surface-2 border border-border px-3 py-2.5 space-y-1">
            <p className="text-[11px] font-medium text-fg">How to use</p>
            <ul className="text-[11px] text-fg-subtle space-y-0.5 list-disc list-inside">
              <li>Print the QR code and place it on tables or at the entrance</li>
              <li>Share the link on Instagram, WhatsApp, or Google Maps</li>
              <li>Customers scan → browse your menu → place order instantly</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── TabGeneral ─────────────────────────────────────────────────────────────--

interface Props {
  settings: RestaurantSettings;
  onChange: (patch: Partial<RestaurantSettings>) => void;
}

export function TabGeneral({ settings, onChange }: Props) {
  const set = <K extends keyof RestaurantSettings>(key: K, val: RestaurantSettings[K]) =>
    onChange({ [key]: val } as Partial<RestaurantSettings>);

  const restaurant = useAuthStore((s) => s.restaurant);
  const restaurantCode = restaurant?.restaurantCode ?? null;
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopyCode = async () => {
    if (!restaurantCode) return;
    try {
      await navigator.clipboard.writeText(restaurantCode);
    } catch {
      const el = document.createElement("textarea");
      el.value = restaurantCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="space-y-6">

      {/* ── Restaurant code — staff use this to clock in ── */}
      <div className="rounded-xl border border-border bg-surface px-5 py-5">
        <div className="flex items-center gap-2 mb-3">
          <Key className="h-4 w-4 text-fg-subtle" />
          <span className="text-[13px] font-semibold text-fg">Restaurant code</span>
        </div>
        {restaurantCode ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <div className="inline-flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-4 py-2.5">
                <span className="text-[22px] font-bold font-mono tracking-[0.25em] text-fg select-all">
                  {restaurantCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  title="Copy code"
                  className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-[11px] font-medium text-fg hover:bg-surface-2 transition-colors"
                >
                  {codeCopied
                    ? <Check className="h-3.5 w-3.5 text-green-500" />
                    : <Copy className="h-3.5 w-3.5" />}
                  {codeCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-fg-subtle max-w-xs">
              Share this code with your staff. They enter it on the Staff login tab together with their 4-digit PIN to clock in.
            </p>
          </div>
        ) : (
          <p className="text-[12px] text-fg-subtle">
            Your restaurant code will appear here once your profile is saved.
          </p>
        )}
      </div>

      {/* ── Menu link & QR code — read-only, shown for every restaurant ── */}
      <MenuQrSection slug={settings.slug} restaurantName={settings.name} />

      {/* ── Restaurant profile ── */}
      <SettingsSection>
        <SettingsRow label="Restaurant name" description="Displayed to customers across the platform">
          <Input value={settings.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. My Restaurant" />
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

      {/* ── Localisation ── */}
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