'use client';

console.log("[DIAGNOSTIC] LoginPageContent.tsx module loaded");

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Clock, IndianRupee, ShoppingBag, Store, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

import { AdminLoginForm, type AdminLoginValues } from '@/components/auth/AdminLoginForm';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { StaffLoginForm, type StaffLoginValues, saveRestaurantCode } from '@/components/auth/StaffLoginForm';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { getRedirectPath } from '@/constants/auth';
import { useAuthStore } from '@/stores/auth.store';
import type { ApiSuccess, LoginResponse } from '@/types';

type AuthTab = 'ADMIN' | 'STAFF';
const AUTH_TABS: Record<AuthTab, AuthTab> = { ADMIN: 'ADMIN', STAFF: 'STAFF' };

type StaffLoginResponse = LoginResponse & {
  restaurant: { id: string; name: string; slug: string; restaurantCode: string };
};

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 py-2 text-[13px] font-medium rounded-lg transition-all duration-150',
        active ? 'bg-bg shadow-sm text-fg border border-border' : 'text-fg-muted hover:text-fg',
      )}
    >
      {children}
    </button>
  );
}

const PREVIEW_METRICS = [
  {
    icon: IndianRupee,
    label: 'Revenue today',
    value: 'INR 24,350',
    color: 'text-accent',
    bg: 'bg-accent/10 border-accent/20',
  },
  { icon: ShoppingBag, label: 'Orders', value: '148', color: 'text-info', bg: 'bg-info/10 border-info/20' },
  { icon: Clock, label: 'Avg prep time', value: '12m', color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
  { icon: TrendingUp, label: 'Completion rate', value: '96.2%', color: 'text-success', bg: 'bg-success/10 border-success/20' },
] as const;

function RightPanel() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="hidden lg:flex relative overflow-hidden border-l border-border bg-surface">
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--fg)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--fg)) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full bg-accent/8 blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-info/6 blur-[60px] pointer-events-none" />

      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-bg/30 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between p-12 w-full">
        <div className="flex items-center gap-1.5 text-[11px] text-fg-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-success live-dot" />
          <span className="uppercase tracking-[0.15em] font-medium">All systems operational</span>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-fg-subtle font-semibold">
              Kitchen operations, simplified
            </div>
            <h2 className="text-[32px] font-semibold tracking-tight text-fg max-w-[340px] leading-[1.12]">
              The operating system for modern restaurants.
            </h2>
            <p className="text-[13px] text-fg-muted max-w-[300px] leading-relaxed">
              Real-time KDS, order routing, menu control, and live analytics - built for speed on the line.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {PREVIEW_METRICS.map((metric, i) => (
              <div
                key={metric.label}
                className={cn(
                  'rounded-xl border border-border bg-bg/60 backdrop-blur-sm p-3.5',
                  'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
                  'transition-all duration-500',
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
                )}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">{metric.label}</span>
                  <div className={cn('grid h-6 w-6 place-items-center rounded-md border', metric.bg)}>
                    <metric.icon className={cn('h-3 w-3', metric.color)} />
                  </div>
                </div>
                <div className="text-[20px] font-semibold text-fg tracking-tight num">{metric.value}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-fg-subtle/50 -mt-1">Sample data for illustration only</p>
        </div>

        <div aria-hidden />
      </div>
    </div>
  );
}

export default function LoginPageContent() {
  console.log("[DIAGNOSTIC] LoginPageContent component execution started");
  const router = useRouter();
  console.log("[DIAGNOSTIC] LoginPageContent immediately before useSearchParams()");
  const searchParams = useSearchParams();
  console.log("[DIAGNOSTIC] LoginPageContent immediately after useSearchParams()");
  const { accessToken, user, setAuth } = useAuthStore();

  const [activeTab, setActiveTab] = useState<AuthTab>(AUTH_TABS.ADMIN);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const handleResendVerification = async () => {
    if (!resendEmail || resendLoading) return;
    setResendLoading(true);
    try {
      await api.post('/auth/resend-verification', { email: resendEmail });
      setResendSent(true);
      toast.success('Verification email sent - check your inbox.');
    } catch {
      toast.error('Could not resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && user) {
      const next = searchParams.get('next');
      router.replace(next ? decodeURIComponent(next) : getRedirectPath(user.role));
    }
  }, [accessToken, user, router, searchParams]);

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
        const { data } = await api.post<ApiSuccess<{ accessToken: string; user: import('@/types').User; restaurant?: any }>>(
          '/auth/exchange',
          { code },
        );

        setAuth(data.data.accessToken, data.data.user, data.data.restaurant ?? null, (data.data as any).refreshToken);
        toast.success('Signed in with Google');

        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('code');
        history.replaceState(null, '', newUrl.toString());

        // New Google-OAuth admin users won't have a restaurant yet;
        // send them to finish setup before accessing the dashboard.
        if (data.data.user.role === 'ADMIN' && !data.data.user.restaurantId) {
          router.replace('/register/restaurant-setup');
          return;
        }

        const next = searchParams.get('next');
        router.replace(next ? decodeURIComponent(next) : getRedirectPath(data.data.user.role));
      } catch {
        toast.error('Google sign-in verification failed');
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('code');
        history.replaceState(null, '', newUrl.toString());
      }
    };

    handleExchange();
     
  }, [searchParams]);

  const handleAdminSubmit = async (values: AdminLoginValues) => {
    setAdminError(null);
    try {
      const { data } = await api.post<ApiSuccess<LoginResponse>>('/auth/login', {
        email: values.email,
        password: values.password,
      });

      const role = data.data.user.role;

      if (role === 'KITCHEN_STAFF' || role === 'WAITER') {
        setAdminError(
          'This portal is for restaurant owners and admins only. Staff should use the "Staff" tab and log in with a restaurant code and PIN.',
        );
        return;
      }

      // Owner/admin login does not include a restaurant payload, so clear any
      // stale restaurant info from a previous session.
      setAuth(data.data.accessToken, data.data.user, null, (data.data as any).refreshToken);
      toast.success('Signed in successfully');
      const next = searchParams.get('next');
      router.push(next ? decodeURIComponent(next) : getRedirectPath(role));
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.error?.message ??
        'Invalid email or password';

      const isVerificationError = message.toLowerCase().includes('verify') || message.toLowerCase().includes('verification');
      if (isVerificationError) {
        setResendEmail(values.email);
        setResendSent(false);
      }
      setAdminError(message);
    }
  };

  const handleStaffSubmit = async (values: StaffLoginValues) => {
    setStaffError(null);
    try {
      const { data } = await api.post<ApiSuccess<StaffLoginResponse>>('/auth/staff-login', {
        restaurantCode: values.restaurantCode,
        pin: values.pin,
      });
      setAuth(data.data.accessToken, data.data.user, data.data.restaurant, (data.data as any).refreshToken);
      // Remember the restaurant code so staff don't need to re-enter it next time
      saveRestaurantCode(values.restaurantCode, data.data.restaurant?.name);
      toast.success(`Welcome, ${data.data.user.firstName}!`);
      router.push(getRedirectPath(data.data.user.role));
    } catch (err: any) {
      setStaffError(err?.response?.data?.message ?? err?.response?.data?.error?.message ?? 'Invalid restaurant code or PIN');
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-bg text-fg">
      <div className="flex flex-col px-6 py-8 lg:px-16 lg:py-12">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 grid place-items-center rounded-md bg-accent shadow-[0_0_12px_rgba(139,92,246,0.35)]">
            <span className="text-[11px] font-bold text-white">S</span>
          </div>
          <div className="text-[14px] font-semibold tracking-tight">Steward</div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[380px]">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
              <p className="text-[13px] text-fg-muted mt-1.5">Welcome back. Choose your login method below.</p>
            </div>

            <div className="flex gap-1 p-1 rounded-xl bg-surface-2 border border-border mb-6">
              <TabButton
                active={activeTab === AUTH_TABS.ADMIN}
                onClick={() => {
                  setActiveTab(AUTH_TABS.ADMIN);
                  setAdminError(null);
                }}
              >
                Owner / Admin
              </TabButton>
              <TabButton
                active={activeTab === AUTH_TABS.STAFF}
                onClick={() => {
                  setActiveTab(AUTH_TABS.STAFF);
                  setStaffError(null);
                }}
              >
                Staff
              </TabButton>
            </div>

            {activeTab === AUTH_TABS.ADMIN ? (
              <>
                <AdminLoginForm onSubmit={handleAdminSubmit} serverError={adminError} />

                {resendEmail && !resendSent && (
                  <div className="mt-3 rounded-lg border border-warning/30 bg-warning/8 px-3 py-2.5 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-warning">Did not receive the email?</p>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      className="text-[11px] font-semibold text-warning underline underline-offset-2 whitespace-nowrap disabled:opacity-50"
                    >
                      {resendLoading ? 'Sending...' : 'Resend'}
                    </button>
                  </div>
                )}
                {resendSent && (
                  <div className="mt-3 rounded-lg border border-success/30 bg-success/8 px-3 py-2.5 text-[11px] text-success">
                    (sent) Verification email sent - check your inbox.
                  </div>
                )}
              </>
            ) : (
              <StaffLoginForm onSubmit={handleStaffSubmit} serverError={staffError} />
            )}

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

        <div className="flex items-center justify-between text-[11px] text-fg-subtle">
          <span>(c) {new Date().getFullYear()} Steward</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-fg-muted transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-fg-muted transition-colors">
              Terms
            </Link>
            <div className="flex items-center gap-1.5 hover:text-fg-muted cursor-pointer">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span>Status</span>
            </div>
          </div>
        </div>
      </div>

      <RightPanel />
    </div>
  );
}
