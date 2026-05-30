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
  "/orders":               "Orders",
  "/menu":                 "Menu",
  "/staff":                "Staff",
  "/settings":             "Settings",
  "/kitchen":              "Kitchen Board",
  "/kitchen/availability": "Item Availability",
  "/kds":                  "Kitchen Display",
  "/dosa-counter":         "Dosa Counter",
  "/audit":                "Staff Logs",
};

const ADMIN_ONLY_PATHS = ["/dashboard", "/orders", "/menu", "/staff", "/settings"];
const ALLOWED_ROLES    = ["ADMIN", "SUPER_ADMIN", "KITCHEN_STAFF", "WAITER"];
// All paths where the kitchen socket should be active
const KITCHEN_PATHS    = ["/kitchen", "/kds", "/dosa-counter"];

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
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isDashboard = pathname === "/dashboard";

  useSocket({ enabled: isAdmin && isDashboard });
  useKitchenSocket({ enabled: isKitchenPath });

  useEffect(() => { setMounted(true); }, []);

  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    if (!mounted || !isPendingRefresh) return;

    const baseURL = process.env.NEXT_PUBLIC_API_URL!;

    const slowTimer = setTimeout(() => setIsSlowConnection(true), 5_000);
    const controller = new AbortController();
    const hardTimeout = setTimeout(() => controller.abort(), 60_000);

    import("axios").then(({ default: axios }) => {
      axios
        .post(`${baseURL}/auth/refresh`, {}, {
          withCredentials: true,
          signal: controller.signal,
        })
        .then(({ data }) => {
          useAuthStore.getState().setAccessToken(data.data.accessToken);
        })
        .catch(() => {
          useAuthStore.getState().clearAuth();
          router.replace("/login");
        })
        .finally(() => {
          clearTimeout(slowTimer);
          clearTimeout(hardTimeout);
          setIsSlowConnection(false);
        });
    });

    return () => {
      clearTimeout(slowTimer);
      clearTimeout(hardTimeout);
      controller.abort();
    };
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
          {isSlowConnection && (
            <p className="text-[11px] text-fg-subtle mt-1 max-w-[220px] text-center">
              Server is waking up&nbsp;— this can take up to 60&nbsp;s on the first load.
            </p>
          )}
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
