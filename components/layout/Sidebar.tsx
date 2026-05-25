"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed, Users, MonitorPlay,
  LogOut, X, Settings, ClipboardList, ToggleLeft, ChefHat, Wifi, WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSettingsStore } from "@/stores/settings.store";

const navAdmin = [
  { href: "/dashboard", label: "Overview",  icon: LayoutDashboard },
  { href: "/kds",       label: "KDS",        icon: MonitorPlay },
  { href: "/orders",    label: "Orders",     icon: ShoppingCart },
  { href: "/menu",      label: "Menu",       icon: UtensilsCrossed },
  { href: "/staff",     label: "Staff",      icon: Users },
];

const navKitchen = [
  { href: "/kitchen",              label: "Order Queue",      icon: ClipboardList },
  { href: "/kitchen/availability", label: "Item Availability", icon: ToggleLeft },
  { href: "/dosa-counter",         label: "Dosa Counter",      icon: ChefHat },
];

interface SidebarProps { open: boolean; onClose: () => void; }

function NavLink({ href, label, icon: Icon, onClose }: { href: string; label: string; icon: React.ElementType; onClose: () => void }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
  return (
    <li>
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          "group flex items-center gap-2.5 h-9 px-2.5 rounded-lg text-[13px] font-medium transition-colors",
          active
            ? "bg-surface-3 text-fg border border-border-strong"
            : "text-fg-muted hover:bg-surface-2 hover:text-fg border border-transparent"
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-fg" : "text-fg-subtle group-hover:text-fg-muted")} />
        <span>{label}</span>
      </Link>
    </li>
  );
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
  const isKitchen = user?.role === "KITCHEN_STAFF" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const settingsActive = pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={onClose} aria-hidden />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[240px] flex-col bg-surface border-r border-border",
          "transition-transform duration-200 lg:relative lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
              <span className="text-[11px] font-bold text-white">S</span>
            </div>
            <div className="leading-none">
              <div className="text-[13px] font-semibold text-fg">SpiceOS</div>
              <div className="text-[10px] text-fg-subtle mt-0.5">Restaurant Platform</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* WS status indicator */}
            <span title={wsConnected ? "Live" : "Disconnected"} className="shrink-0">
              {wsConnected
                ? <Wifi className="h-3 w-3 text-success" />
                : <WifiOff className="h-3 w-3 text-fg-subtle" />}
            </span>
            <button
              onClick={onClose}
              className="lg:hidden h-7 w-7 grid place-items-center rounded-md text-fg-muted hover:bg-surface-2"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin">
          {isAdmin && (
            <>
              <div className="label-xs px-2.5 mb-1.5">Management</div>
              <ul className="space-y-0.5 mb-4">
                {navAdmin.map((item) => <NavLink key={item.href} {...item} onClose={onClose} />)}
              </ul>
            </>
          )}

          {isKitchen && (
            <>
              <div className="label-xs px-2.5 mb-1.5">Kitchen</div>
              <ul className="space-y-0.5 mb-4">
                {navKitchen.map((item) => <NavLink key={item.href} {...item} onClose={onClose} />)}
              </ul>
            </>
          )}

          {/* System */}
          {isAdmin && (
            <>
              <div className="label-xs px-2.5 mt-1 mb-1.5">System</div>
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href="/settings"
                    onClick={onClose}
                    className={cn(
                      "group flex items-center gap-2.5 h-9 px-2.5 rounded-lg text-[13px] font-medium transition-colors border",
                      settingsActive
                        ? "bg-surface-3 text-fg border-border-strong"
                        : "text-fg-muted hover:bg-surface-2 hover:text-fg border-transparent"
                    )}
                  >
                    <Settings className={cn("h-4 w-4 shrink-0", settingsActive ? "text-fg" : "text-fg-subtle group-hover:text-fg-muted")} />
                    <span>Settings</span>
                  </Link>
                </li>
              </ul>
            </>
          )}
        </nav>

        {/* Profile */}
        <div className="border-t border-border p-2.5 shrink-0">
          <div className="flex items-center gap-2.5 rounded-lg bg-surface-2 border border-border px-2.5 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-3 border border-border-strong text-[11px] font-semibold text-fg shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-medium text-fg leading-tight">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="truncate text-[10px] text-fg-subtle mt-0.5">{roleLabel}</div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="h-7 w-7 grid place-items-center rounded-md text-fg-subtle hover:bg-surface-3 hover:text-danger transition-colors shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
