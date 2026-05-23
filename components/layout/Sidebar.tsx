"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed, Users, MonitorPlay,
  LogOut, X, Settings, ClipboardList, ToggleLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

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
];

interface SidebarProps { open: boolean; onClose: () => void; }

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const initials = user ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() : "—";
  const roleLabel =
    user?.role === "SUPER_ADMIN" ? "Super Admin" :
    user?.role === "ADMIN"       ? "Admin" :
    user?.role === "KITCHEN_STAFF" ? "Kitchen Staff" :
    user?.role ?? "";

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isKitchen = user?.role === "KITCHEN_STAFF" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const active = pathname === href || pathname.startsWith(href + "/");
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
          <Icon className={cn("h-4 w-4", active ? "text-fg" : "text-fg-subtle group-hover:text-fg-muted")} />
          <span>{label}</span>
        </Link>
      </li>
    );
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[240px] flex-col bg-surface border-r border-border",
          "transition-transform duration-200 lg:relative lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
              <span className="text-[11px] font-bold text-white">S</span>
            </div>
            <div className="leading-none">
              <div className="text-[13px] font-semibold text-fg">SpiceOS</div>
              <div className="text-[10px] text-fg-subtle mt-0.5">Restaurant Platform</div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden h-7 w-7 grid place-items-center rounded-md text-fg-muted hover:bg-surface-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin">
          {/* Admin section */}
          {isAdmin && (
            <>
              <div className="label-xs px-2.5 mb-1.5">Management</div>
              <ul className="space-y-0.5 mb-4">
                {navAdmin.map((item) => <NavLink key={item.href} {...item} />)}
              </ul>
            </>
          )}

          {/* Kitchen section */}
          {isKitchen && (
            <>
              <div className="label-xs px-2.5 mb-1.5">Kitchen</div>
              <ul className="space-y-0.5 mb-4">
                {navKitchen.map((item) => <NavLink key={item.href} {...item} />)}
              </ul>
            </>
          )}

          <div className="label-xs px-2.5 mt-1 mb-1.5">System</div>
          <ul className="space-y-0.5">
            <li>
              <Link
                href="/settings"
                className="group flex items-center gap-2.5 h-9 px-2.5 rounded-lg text-[13px] font-medium text-fg-muted hover:bg-surface-2 hover:text-fg border border-transparent transition-colors"
              >
                <Settings className="h-4 w-4 text-fg-subtle group-hover:text-fg-muted" />
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Profile */}
        <div className="border-t border-border p-2.5">
          <div className="flex items-center gap-2.5 rounded-lg bg-surface-2 border border-border px-2.5 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-3 border border-border-strong text-[11px] font-semibold text-fg">
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
              className="h-7 w-7 grid place-items-center rounded-md text-fg-subtle hover:bg-surface-3 hover:text-danger transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
