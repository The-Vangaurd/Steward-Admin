'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Store, IndianRupee, ShoppingBag, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { AdminLoginForm, type AdminLoginValues } from '@/components/auth/AdminLoginForm';
import { StaffLoginForm, type StaffLoginValues } from '@/components/auth/StaffLoginForm';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { AUTH_TABS, getRedirectPath, type AuthTab } from '@/constants/auth';
import api from '@/lib/axios';
import type { ApiSuccess, LoginResponse } from '@/types';
import { cn } from '@/lib/utils';

interface StaffLoginResponse extends LoginResponse {
  restaurant: { id: string; name: string; slug: string; restaurantCode: string };
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 py-2 text-[13px] font-medium rounded-lg transition-all duration-150",
        active
          ? "bg-bg shadow-sm text-fg border border-border"
          : "text-fg-muted hover:text-fg"
      )}
    >
      {children}
    </button>
  );
}

// ─── Right panel — animated preview cards ────────────────────────────────────

const PREVIEW_METRICS = [
  { icon: IndianRupee, label: "Revenue today",    value: "₹24,350", color: "text-accent",  bg: "bg-accent/10 border-accent/20" },
  { icon: ShoppingBag, label: "Orders",           value: "148",     color: "text-info",    bg: "bg-info/10 border-info/20" },
  { icon: Clock,       label: "Avg prep time",    value: "12m",     color: "text-warning", bg: "bg-warning/10 border-warning/20" },
  { icon: TrendingUp,  label: "Completion rate",  value: "96.2%",   color: "text-success", bg: "bg-success/10 border-success/20" },
];

function RightPanel() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slight delay before animating in cards
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="hidden lg:flex relative overflow-hidden border-l border-border bg-surface">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--fg)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--fg)) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Accent glow blobs */}
      <div className="absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full bg-accent/8 blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-info/6 blur-[60px] pointer-events-none" />

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-bg/30 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between p-12 w-full">
        {/* Top status badge */}
        <div className="flex items-center gap-1.5 text-[11px] text-fg-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-success live-dot" />
          <span className="uppercase tracking-[0.15em] font-medium">All systems operational</span>
        </div>

        {/* Headline + subtext */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-fg-subtle font-semibold">
              Kitchen operations, simplified
            </div>
            <h2 className="text-[32px] font-semibold tracking-tight text-fg max-w-[340px] leading-[1.12]">
              The operating system for modern restaurants.
            </h2>
            <p className="text-[13px] text-fg-muted max-w-[300px] leading-relaxed">
              Real-time KDS, order routing, menu control, and live analytics — built for speed on the line.
            </p>
          </div>

          {/* Mini dashboard preview cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {PREVIEW_METRICS.map((metric, i) => (
              <div
                key={metric.label}
                className={cn(
                  "rounded-xl border border-border bg-bg/60 backdrop-blur-sm p-3.5",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                  "transition-all duration-500",
                  visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-3"
                )}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                    {metric.label}
                  </span>
                  <div className={cn("grid h-6 w-6 place-items-center rounded-md border", metric.bg)}>
                    <metric.icon className={cn("h-3 w-3", metric.color)} />
                  </div>
                </div>
                <div className="text-[20px] font-semibold text-fg tracking-tight num">
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-fg-subtle/50 -mt-1">
            Sample data for illustration only
          </p>
        </div>

        {/* Bottom spacer */}
        <div aria-hidden />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { accessToken, user, setAuth } = useAuthStore();

  const [activeTab,   setActiveTab]   = useState<AuthTab>(AUTH_TABS.ADMIN);
  const [adminError,  setAdminError]  = useState<string | null>(null);
  const [staffError,  setStaffError]  = useState<string | null>(null);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (accessToken && user) {
      const next = searchParams.get('next');
      router.replace(next ? decodeURIComponent(next) : getRedirectPath(user.role));
    }
  }, [accessToken, user, router, searchParams]);

  // Handle OAuth callback — read code from search query parameters and exchange it
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (searchParams.get('error') === 'oauth_failed') {
      toast.error('Google sign-in failed or was cancelled');
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      history.replaceState(null, '', newUrl.toString());
      return;
    }

    const code = searchParams.get('code');
    if (!code) return;

    const handleExchange = async () => {
      try {
        const { data } = await api.post<ApiSuccess<{ accessToken: string; user: import('@/types').User }>>(
          '/auth/exchange',
          { code }
        );

        setAuth(data.data.accessToken, data.data.user);
        toast.success('Signed in with Google');

        // Scrub code from the browser URL immediately
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('code');
        history.replaceState(null, '', newUrl.toString());

        const next = searchParams.get('next');
        router.replace(next ? decodeURIComponent(next) : getRedirectPath(data.data.user.role));
      } catch (err: any) {
        toast.error('Google sign-in verification failed');
        // Scrub code from URL on failure too
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('code');
        history.replaceState(null, '', newUrl.toString());
      }
    };

    handleExchange();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleAdminSubmit = async (values: AdminLoginValues) => {
    setAdminError(null);
    try {
      const { data } = await api.post<ApiSuccess<LoginResponse>>('/auth/login', {
        email: values.email,
        password: values.password,
      });
      setAuth(data.data.accessToken, data.data.user);
      toast.success('Signed in successfully');
      const next = searchParams.get('next');
      router.push(next ? decodeURIComponent(next) : getRedirectPath(data.data.user.role));
    } catch (err: any) {
      setAdminError(
        err?.response?.data?.message ??
        err?.response?.data?.error?.message ??
        'Invalid email or password'
      );
    }
  };

  const handleStaffSubmit = async (values: StaffLoginValues) => {
    setStaffError(null);
    try {
      const { data } = await api.post<ApiSuccess<StaffLoginResponse>>('/auth/staff-login', {
        restaurantCode: values.restaurantCode,
        pin: values.pin,
      });
      setAuth(data.data.accessToken, data.data.user, data.data.restaurant);
      toast.success(`Welcome, ${data.data.user.firstName}!`);
      router.push(getRedirectPath(data.data.user.role));
    } catch (err: any) {
      setStaffError(
        err?.response?.data?.message ??
        err?.response?.data?.error?.message ??
        'Invalid restaurant code or PIN'
      );
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-bg text-fg">
      {/* ── Left panel ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col px-6 py-8 lg:px-16 lg:py-12">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 grid place-items-center rounded-md bg-accent shadow-[0_0_12px_rgba(139,92,246,0.35)]">
            <span className="text-[11px] font-bold text-white">S</span>
          </div>
          <div className="text-[14px] font-semibold tracking-tight">SpiceOS</div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[380px]">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
              <p className="text-[13px] text-fg-muted mt-1.5">
                Welcome back. Choose your login method below.
              </p>
            </div>

            {/* Auth type tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-surface-2 border border-border mb-6">
              <TabButton
                active={activeTab === AUTH_TABS.ADMIN}
                onClick={() => { setActiveTab(AUTH_TABS.ADMIN); setAdminError(null); }}
              >
                Owner / Admin
              </TabButton>
              <TabButton
                active={activeTab === AUTH_TABS.STAFF}
                onClick={() => { setActiveTab(AUTH_TABS.STAFF); setStaffError(null); }}
              >
                Staff
              </TabButton>
            </div>

            {/* Forms */}
            {activeTab === AUTH_TABS.ADMIN ? (
              <AdminLoginForm onSubmit={handleAdminSubmit} serverError={adminError} />
            ) : (
              <StaffLoginForm onSubmit={handleStaffSubmit} serverError={staffError} />
            )}

            {/* OAuth — admin tab only */}
            {activeTab === AUTH_TABS.ADMIN && (
              <div className="mt-5">
                <div className="relative flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] text-fg-subtle font-medium uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="mt-3">
                  <OAuthButtons />
                </div>
              </div>
            )}

            {/* Register CTA — admin only */}
            {activeTab === AUTH_TABS.ADMIN && (
              <div className="mt-5 rounded-xl border border-border bg-surface px-4 py-3.5 flex items-center justify-between gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div>
                  <p className="text-[12px] font-semibold text-fg">New restaurant?</p>
                  <p className="text-[11px] text-fg-muted mt-0.5">Get set up in under a minute.</p>
                </div>
                <Link href="/register">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-bg px-3 py-1.5 text-[12px] font-medium text-fg hover:bg-surface-2 hover:border-border-strong transition-all whitespace-nowrap"
                  >
                    <Store className="h-3 w-3" />
                    Register
                  </button>
                </Link>
              </div>
            )}

            <p className="mt-6 text-[11px] text-fg-subtle text-center leading-relaxed">
              Protected area. Unauthorized access is monitored and logged.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-fg-subtle">
          <span>© 2026 SpiceOS</span>
          <div className="flex items-center gap-4">
            <span className="hover:text-fg-muted cursor-not-allowed" title="Coming soon">Privacy</span>
            <span className="hover:text-fg-muted cursor-not-allowed" title="Coming soon">Terms</span>
            <div className="flex items-center gap-1.5 hover:text-fg-muted cursor-pointer">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span>Status</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right visual panel ───────────────────────────────────────────────── */}
      <RightPanel />
    </div>
  );
}
