"use client";

import { Menu, Search, Bell, Command } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

interface HeaderProps { onMenuClick: () => void; title: string; }

export function Header({ onMenuClick, title }: HeaderProps) {
  const user = useAuthStore((s) => s.user);
  const initials = user ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() : "";

  return (
    <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-border bg-bg/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-bg/60">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="lg:hidden h-8 w-8 grid place-items-center rounded-md text-fg-muted hover:bg-surface-2"
        >
          <Menu className="h-4 w-4" />
        </button>
        <span className="text-fg-subtle text-[12px]">SpiceOS</span>
        <span className="text-fg-subtle text-[12px]">/</span>
        <h1 className="text-[13px] font-semibold text-fg tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="hidden md:flex items-center gap-2 h-8 w-64 px-2.5 rounded-md border border-border bg-surface text-[12px] text-fg-subtle hover:border-border-strong hover:text-fg-muted transition-colors">
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Search orders, items…</span>
          <span className="flex items-center gap-0.5 text-[10px] text-fg-subtle">
            <Command className="h-2.5 w-2.5" />K
          </span>
        </button>

        {/* Live indicator */}
        <div className="hidden md:flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border bg-surface">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-success live-dot" />
          </span>
          <span className="text-[11px] font-medium text-fg-muted">Live</span>
        </div>

        <button className="relative h-8 w-8 grid place-items-center rounded-md border border-border bg-surface text-fg-muted hover:text-fg hover:border-border-strong transition-colors">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
        </button>

        <div className="h-8 w-8 grid place-items-center rounded-md bg-surface-3 border border-border-strong text-[11px] font-semibold text-fg">
          {initials}
        </div>
      </div>
    </header>
  );
}
