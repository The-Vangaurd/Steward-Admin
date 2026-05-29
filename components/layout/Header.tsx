"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Menu, Search, Bell, Command, X, ShoppingBag, Circle,
  LogOut, User, ChevronRight, Loader2, Package,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useAuth } from "@/hooks/useAuth";
import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { cn, formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { Order, ApiSuccess } from "@/types";

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

// ─── Notification Panel ───────────────────────────────────────────────────────

function useRecentOrders() {
  return useQuery({
    queryKey: ["header-recent-orders"],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Order[]>>("/orders/admin/list", {
        params: { limit: 6, page: 1 },
      });
      return data.data ?? [];
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "text-warning",
  PENDING: "text-warning",
  CONFIRMED: "text-info",
  PREPARING: "text-info",
  READY: "text-success",
  COMPLETED: "text-fg-subtle",
  CANCELLED: "text-danger",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { data: orders, isLoading } = useRecentOrders();

  return (
    <div
      className={cn(
        "absolute right-0 top-full mt-2 z-50 w-[340px]",
        "rounded-xl border border-border bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
        "animate-in fade-in-0 slide-in-from-top-2 duration-150"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-fg">Recent Orders</span>
          {orders && orders.length > 0 && (
            <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
              {orders.filter((o) => o.status === "NEW" || o.status === "PENDING").length || ""}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="grid h-6 w-6 place-items-center rounded-md text-fg-subtle hover:bg-surface-2 hover:text-fg transition-colors"
          aria-label="Close notifications"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[360px] overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-fg-subtle">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-[12px]">Loading orders…</span>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-2 border border-border">
              <Package className="h-4.5 w-4.5 text-fg-subtle" />
            </div>
            <p className="text-[12px] text-fg-subtle">No recent orders</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {orders.map((order: any) => (
              <li key={order.id} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-2 transition-colors">
                <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-2 border border-border">
                  <ShoppingBag className="h-3.5 w-3.5 text-fg-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold text-fg font-mono">
                      #{order.orderNumber}
                    </span>
                    <span className={cn("text-[10px] font-semibold uppercase tracking-wider", STATUS_COLORS[order.status] ?? "text-fg-muted")}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[11px] text-fg-muted truncate">
                      {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? "s" : ""} · {formatCurrency(order.totalAmount ?? 0)}
                    </span>
                    <span className="text-[10px] text-fg-subtle shrink-0 ml-2">
                      {order.createdAt ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }) : ""}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-2.5">
        <a
          href="/orders"
          className="flex items-center justify-between text-[11px] text-fg-muted hover:text-fg transition-colors group"
        >
          <span>View all orders</span>
          <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
}

// ─── Search Modal ─────────────────────────────────────────────────────────────

const QUICK_LINKS = [
  { label: "Orders", href: "/orders", icon: ShoppingBag },
  { label: "Kitchen Board", href: "/kitchen", icon: Circle },
  { label: "Menu", href: "/menu", icon: Package },
];

function QuickLinks({ onClose }: { onClose: () => void }) {
  return (
    <>
      <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
        Quick Navigation
      </p>
      <ul className="space-y-0.5">
        {QUICK_LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-2 transition-colors"
            >
              <div className="grid h-7 w-7 place-items-center rounded-md bg-surface-2 border border-border">
                <link.icon className="h-3.5 w-3.5 text-fg-muted" />
              </div>
              <span className="text-[13px] font-medium text-fg">{link.label}</span>
              <ChevronRight className="ml-auto h-3.5 w-3.5 text-fg-subtle" />
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

function SearchResults({ query, onClose }: { query: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["order-search", query],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Order[]>>("/orders/search", {
        params: { q: query, limit: 8 },
      });
      return data.data ?? [];
    },
    enabled: query.length >= 2,
    staleTime: 10_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-fg-subtle">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-[12px]">Searching…</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8">
        <Search className="h-8 w-8 text-fg-subtle/40" />
        <p className="text-[13px] font-medium text-fg-muted">No results for "{query}"</p>
      </div>
    );
  }

  return (
    <ul className="space-y-0.5 p-1">
      {data.map((order: any) => (
        <li key={order.id}>
          <a
            href={`/orders?highlight=${order.id}`}
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-2 transition-colors"
          >
            <div className="grid h-7 w-7 place-items-center rounded-md bg-surface-2 border border-border">
              <ShoppingBag className="h-3.5 w-3.5 text-fg-muted" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-fg font-mono">#{order.orderNumber}</p>
              <p className="text-[11px] text-fg-muted truncate">
                {order.customerName ?? "Guest"} · {order.status}
              </p>
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}

function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className={cn(
          "relative w-full max-w-[520px] rounded-xl border border-border bg-surface",
          "shadow-[0_32px_80px_rgba(0,0,0,0.6)]",
          "animate-in fade-in-0 zoom-in-95 duration-150"
        )}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="h-4 w-4 text-fg-subtle shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders, menu items, staff…"
            className="flex-1 bg-transparent text-[14px] text-fg placeholder:text-fg-subtle focus:outline-none"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setDebouncedQuery(""); }}
              className="grid h-5 w-5 place-items-center rounded-md text-fg-subtle hover:text-fg"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] text-fg-subtle">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="p-2">
          {!query ? (
            <QuickLinks onClose={onClose} />
          ) : query.length < 2 ? (
            <p className="px-4 py-8 text-center text-[12px] text-fg-subtle">Type at least 2 characters…</p>
          ) : (
            <SearchResults query={debouncedQuery} onClose={onClose} />
          )}
        </div>

        <div className="border-t border-border px-4 py-2 flex items-center gap-3">
          <span className="text-[10px] text-fg-subtle">
            <kbd className="rounded border border-border px-1 py-0.5 text-[9px]">↑</kbd>{" "}
            <kbd className="rounded border border-border px-1 py-0.5 text-[9px]">↓</kbd> to navigate
          </span>
          <span className="text-[10px] text-fg-subtle">
            <kbd className="rounded border border-border px-1 py-0.5 text-[9px]">↵</kbd> to open
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── User Menu ────────────────────────────────────────────────────────────────

function UserMenu({ initials, onClose }: { initials: string; onClose: () => void }) {
  const { user, logout } = useAuth();

  const roleLabel =
    user?.role === "SUPER_ADMIN" ? "Super Admin" :
    user?.role === "ADMIN" ? "Admin" :
    user?.role === "KITCHEN_STAFF" ? "Kitchen Staff" :
    user?.role === "WAITER" ? "Waiter" :
    user?.role ?? "";

  return (
    <div
      className={cn(
        "absolute right-0 top-full mt-2 z-50 w-[220px]",
        "rounded-xl border border-border bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
        "animate-in fade-in-0 slide-in-from-top-2 duration-150"
      )}
    >
      {/* Profile */}
      <div className="px-3.5 py-3 border-b border-border">
        <p className="text-[13px] font-semibold text-fg truncate">
          {user?.firstName} {user?.lastName}
        </p>
        <p className="text-[11px] text-fg-subtle truncate mt-0.5">{user?.email}</p>
        <span className="inline-flex mt-2 items-center rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-fg-muted">
          {roleLabel}
        </span>
      </div>

      {/* Actions */}
      <div className="p-1">
        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-danger hover:bg-danger/10 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header({ onMenuClick, title }: HeaderProps) {
  const user = useAuthStore((s) => s.user);
  const { data: settings } = useRestaurantSettings();
  const restaurantName = user?.restaurantId
    ? ((settings as any)?.restaurantName ?? settings?.name ?? "Steward")
    : "Steward";
  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "";

  const [notifOpen, setNotifOpen]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userOpen, setUserOpen]     = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);

  // Close panels on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Use recent orders to determine if there are any NEW orders
  const { data: recentOrders } = useRecentOrders();
  const newOrderCount = recentOrders?.filter(
    (o: any) => o.status === "NEW" || o.status === "PENDING"
  ).length ?? 0;

  return (
    <>
      <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-border bg-bg/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-bg/60">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuClick}
            className="lg:hidden h-8 w-8 grid place-items-center rounded-md text-fg-muted hover:bg-surface-2 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="text-fg-subtle text-[12px]">{restaurantName}</span>
          <span className="text-fg-subtle text-[12px]">/</span>
          <h1 className="text-[13px] font-semibold text-fg tracking-tight">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            aria-keyshortcuts="Control+K Meta+K"
            className="hidden md:flex items-center gap-2 h-8 w-60 px-2.5 rounded-md border border-border bg-surface text-[12px] text-fg-subtle hover:border-border-strong hover:text-fg-muted transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">Search orders, items…</span>
            <span className="flex items-center gap-0.5 text-[10px] text-fg-subtle border border-border rounded px-1 py-0.5">
              <Command className="h-2.5 w-2.5" />K
            </span>
          </button>

          {/* Mobile search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden h-8 w-8 grid place-items-center rounded-md border border-border bg-surface text-fg-muted hover:text-fg hover:border-border-strong transition-colors"
            aria-label="Search"
          >
            <Search className="h-3.5 w-3.5" />
          </button>

          {/* Live indicator */}
          <div className="hidden md:flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border bg-surface">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-success live-dot" />
            </span>
            <span className="text-[11px] font-medium text-fg-muted">Live</span>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen((v) => !v); setUserOpen(false); }}
              aria-label={`Notifications${newOrderCount > 0 ? `, ${newOrderCount} new` : ""}`}
              aria-expanded={notifOpen}
              className={cn(
                "relative h-8 w-8 grid place-items-center rounded-md border bg-surface text-fg-muted hover:text-fg transition-colors",
                notifOpen ? "border-border-strong text-fg bg-surface-2" : "border-border hover:border-border-strong"
              )}
            >
              <Bell className="h-3.5 w-3.5" />
              {newOrderCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 h-3.5 min-w-[14px] px-0.5 rounded-full bg-accent text-[8px] font-bold text-white grid place-items-center tabular-nums">
                  {newOrderCount > 9 ? "9+" : newOrderCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <NotificationPanel onClose={() => setNotifOpen(false)} />
            )}
          </div>

          {/* User avatar */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => { setUserOpen((v) => !v); setNotifOpen(false); }}
              aria-label="Account menu"
              aria-expanded={userOpen}
              className={cn(
                "h-8 w-8 grid place-items-center rounded-md border bg-surface-3 text-[11px] font-semibold text-fg transition-colors",
                userOpen ? "border-border-strong ring-1 ring-accent/30" : "border-border-strong hover:border-border"
              )}
            >
              {initials}
            </button>

            {userOpen && (
              <UserMenu initials={initials} onClose={() => setUserOpen(false)} />
            )}
          </div>
        </div>
      </header>

      {/* Search modal (portal-style, rendered at the end of body) */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
