"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed, Users,
  LogOut, X, Settings, ToggleLeft, Wifi, WifiOff, Kanban,
  MonitorPlay, Soup,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSettingsStore } from "@/stores/settings.store";

// ─── Nav definitions ──────────────────────────────────────────────────────────

const navAdmin = [
  { href: "/dashboard", label: "Overview",  icon: LayoutDashboard },
  { href: "/orders",    label: "Orders",    icon: ShoppingCart },
  { href: "/menu",      label: "Menu",      icon: UtensilsCrossed },
  { href: "/staff",     label: "Staff",     icon: Users },
];

const navKitchen = [
  { href: "/kitchen",              label: "Kitchen Board",    icon: Kanban },
  { href: "/kds",                  label: "KDS View",         icon: MonitorPlay },
  { href: "/kitchen/availability", label: "Availability",     icon: ToggleLeft },
  { href: "/dosa-counter",         label: "Dosa Counter",     icon: Soup },
];

// ─── NavLink ──────────────────────────────────────────────────────────────────

function NavLink({
  href,
  label,
  icon: Icon,
  onClose,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const active =
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href + "/"));

  return (
    <li>
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          "group relative flex items-center gap-2.5 h-9 px-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 active:scale-[0.97] active:duration-75",
          active
            ? "bg-surface-3 text-fg border border-border-strong shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            : "text-fg-muted hover:bg-surface-2 hover:text-fg border border-transparent"
        )}
      >
        {/* Active accent line */}
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-r-full bg-accent opacity-80" />
        )}
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            active ? "text-accent" : "text-fg-subtle group-hover:text-fg-muted"
          )}
        />
        <span>{label}</span>
      </Link>
    </li>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="label-xs px-2.5 mb-1.5 mt-0.5">{children}</div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { wsConnected } = useSettingsStore();

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "—";

  const roleLabel =
    user?.role === "SUPER_ADMIN"   ? "Super Admin" :
    user?.role === "ADMIN"         ? "Admin" :
    user?.role === "KITCHEN_STAFF" ? "Kitchen Staff" :
    user?.role === "WAITER"        ? "Waiter" :
    user?.role ?? "";

  const isAdmin   = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isKitchen =
    user?.role === "KITCHEN_STAFF" ||
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN";

  const settingsActive =
    pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[240px] flex-col",
          "bg-surface border-r border-border",
          "transition-transform duration-200 lg:relative lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4 shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Logo mark */}
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent shadow-[0_0_12px_rgba(139,92,246,0.3)]">
              <span className="text-[11px] font-bold text-white">S</span>
            </div>
            <div className="leading-none">
              <div className="text-[13px] font-semibold text-fg">SpiceOS</div>
              <div className="text-[10px] text-fg-subtle mt-0.5">Restaurant Platform</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* WS connection indicator */}
            <span
              title={wsConnected ? "Connected — live updates active" : "Disconnected — check network"}
              className="shrink-0"
            >
              {wsConnected ? (
                <div className="flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inset-0 rounded-full bg-success live-dot" />
                  </span>
                </div>
              ) : (
                <WifiOff className="h-3 w-3 text-fg-subtle" />
              )}
            </span>

            <button
              onClick={onClose}
              className="lg:hidden h-9 w-9 grid place-items-center rounded-md text-fg-muted hover:bg-surface-2 transition-colors touch-target"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin space-y-0">
          {/* Admin section */}
          {isAdmin && (
            <div className="mb-3">
              <SectionLabel>Management</SectionLabel>
              <ul className="space-y-0.5">
                {navAdmin.map((item) => (
                  <NavLink key={item.href} {...item} onClose={onClose} />
                ))}
              </ul>
            </div>
          )}

          {/* Kitchen section */}
          {isKitchen && (
            <div className="mb-3">
              <SectionLabel>Kitchen</SectionLabel>
              <ul className="space-y-0.5">
                {navKitchen.map((item) => (
                  <NavLink key={item.href} {...item} onClose={onClose} />
                ))}
              </ul>
            </div>
          )}

          {/* System section */}
          {isAdmin && (
            <div className="mb-3">
              <SectionLabel>System</SectionLabel>
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href="/settings"
                    onClick={onClose}
                    className={cn(
                      "group relative flex items-center gap-2.5 h-9 px-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 active:scale-[0.97] active:duration-75 border",
                      settingsActive
                        ? "bg-surface-3 text-fg border-border-strong shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                        : "text-fg-muted hover:bg-surface-2 hover:text-fg border-transparent"
                    )}
                  >
                    {settingsActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-r-full bg-accent opacity-80" />
                    )}
                    <Settings
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        settingsActive
                          ? "text-accent"
                          : "text-fg-subtle group-hover:text-fg-muted"
                      )}
                    />
                    <span>Settings</span>
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </nav>

        {/* Profile footer */}
        <div className="border-t border-border p-2.5 shrink-0">
          <div className="flex items-center gap-2.5 rounded-lg bg-surface-2 border border-border px-2.5 py-2 hover:border-border-strong transition-colors group">
            {/* Avatar */}
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-3 border border-border-strong text-[11px] font-semibold text-fg shrink-0">
              {initials}
            </div>

            {/* Name & role */}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-medium text-fg leading-tight">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="truncate text-[10px] text-fg-subtle mt-0.5">{roleLabel}</div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              title="Sign out"
              className="h-7 w-7 grid place-items-center rounded-md text-fg-subtle hover:bg-surface-3 hover:text-danger transition-colors shrink-0"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
