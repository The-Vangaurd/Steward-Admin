"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useAuthStore } from "@/stores/auth.store";
import { useSocket } from "@/hooks/useSocket";
import { useKitchenSocket } from "@/hooks/useKitchenSocket";
import { useRequireAuth } from "@/hooks/useAuth";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":            "Overview",
  "/kds":                  "Kitchen Display",
  "/orders":               "Orders",
  "/menu":                 "Menu",
  "/staff":                "Staff",
  "/settings":             "Settings",
  "/kitchen":              "Order Queue",
  "/kitchen/availability": "Item Availability",
  "/dosa-counter":         "Dosa Counter",
};

const ADMIN_ONLY_PATHS = ["/dashboard", "/kds", "/orders", "/menu", "/staff", "/settings"];
const ALLOWED_ROLES    = ["ADMIN", "SUPER_ADMIN", "KITCHEN_STAFF", "WAITER"];

// Kitchen socket is only needed on kitchen-related pages — avoid subscribing on
// every dashboard page (staff, menu, settings, etc.)
const KITCHEN_PATHS = ["/kitchen", "/dosa-counter", "/kds"];

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(path + "/")) return title;
  }
  return "Dashboard";
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isPendingRefresh, user } = useRequireAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted]         = useState(false);

  const isKitchenPath = KITCHEN_PATHS.some((p) => pathname.startsWith(p));

  // Admin socket always active; kitchen socket only on kitchen-related pages
  useSocket();
  useKitchenSocket({ enabled: isKitchenPath });

  useEffect(() => { setMounted(true); }, []);

  // ── Silent refresh on hard reload ─────────────────────────────────────────
  // accessToken is in-memory only (never localStorage). On hard refresh it
  // starts null even for logged-in users. isPendingRefresh catches this state
  // (user in localStorage, token missing). We must actively call /auth/refresh
  // here — the axios 401 interceptor only fires when an API call returns 401,
  // which never happens while the loading spinner blocks all requests.
  useEffect(() => {
    if (!mounted || !isPendingRefresh) return;

    const baseURL = process.env.NEXT_PUBLIC_API_URL!;
    import("axios").then(({ default: axios }) => {
      axios
        .post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
        .then(({ data }) => {
          useAuthStore.getState().setAccessToken(data.data.accessToken);
        })
        .catch(() => {
          useAuthStore.getState().clearAuth();
          router.replace("/login");
        });
    });
  }, [mounted, isPendingRefresh, router]);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated && !isPendingRefresh) { router.replace("/login"); return; }
    if (user && !ALLOWED_ROLES.includes(user.role)) { router.replace("/login"); return; }

    const isKitchenOnly = user?.role === "KITCHEN_STAFF" || user?.role === "WAITER";
    const onAdminPage   = ADMIN_ONLY_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
    if (isKitchenOnly && onAdminPage) router.replace("/kitchen");
  }, [isAuthenticated, isPendingRefresh, user, router, mounted, pathname]);

  if (!mounted || isPendingRefresh || !isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-2.5">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-fg-subtle border-t-fg" />
          <p className="text-[11px] font-medium text-fg-subtle tracking-wide uppercase">Loading</p>
        </div>
      </div>
    );
  }

  const title = resolveTitle(pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-fg">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">{children}</main>
      </div>
    </div>
  );
}
