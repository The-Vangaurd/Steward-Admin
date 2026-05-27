'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Store } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { useAuthStore } from '@/stores/auth.store';
import {
  AdminLoginForm,
  type AdminLoginValues,
} from '@/components/auth/AdminLoginForm';
import {
  StaffLoginForm,
  type StaffLoginValues,
} from '@/components/auth/StaffLoginForm';
import {
  AUTH_TABS,
  getRedirectPath,
  type AuthTab,
} from '@/constants/auth';

import api from '@/lib/axios';
import type { ApiSuccess, LoginResponse } from '@/types';

// ─────────────────────────────────────────────────────────────
// Force runtime rendering to avoid prerender build failures
// caused by useSearchParams + client auth state.
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Staff login response
// ─────────────────────────────────────────────────────────────

interface StaffLoginResponse extends LoginResponse {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    restaurantCode: string;
  };
}

// ─────────────────────────────────────────────────────────────
// Tab button
// ─────────────────────────────────────────────────────────────

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
      className={`flex-1 py-2 text-[13px] font-medium rounded-lg transition-all ${
        active
          ? 'bg-bg shadow-sm text-fg border border-border'
          : 'text-fg-muted hover:text-fg'
      }`}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { accessToken, user, setAuth } = useAuthStore();

  const [activeTab, setActiveTab] = useState<AuthTab>(
    AUTH_TABS.ADMIN
  );

  const [adminError, setAdminError] = useState<string | null>(
    null
  );

  const [staffError, setStaffError] = useState<string | null>(
    null
  );

  // ─────────────────────────────────────────────────────────
  // Auto redirect if already authenticated
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (accessToken && user) {
      const next = searchParams.get('next');

      router.replace(
        next
          ? decodeURIComponent(next)
          : getRedirectPath(user.role)
      );
    }
  }, [accessToken, user, router, searchParams]);

  // ─────────────────────────────────────────────────────────
  // Admin login
  // ─────────────────────────────────────────────────────────

  const handleAdminSubmit = async (
    values: AdminLoginValues
  ) => {
    setAdminError(null);

    try {
      const { data } = await api.post<
        ApiSuccess<LoginResponse>
      >('/auth/login', {
        email: values.email,
        password: values.password,
      });

      setAuth(data.data.accessToken, data.data.user);

      toast.success('Signed in successfully');

      const next = searchParams.get('next');

      router.push(
        next
          ? decodeURIComponent(next)
          : getRedirectPath(data.data.user.role)
      );
    } catch (err: any) {
      setAdminError(
        err?.response?.data?.message ??
          err?.response?.data?.error?.message ??
          'Invalid email or password'
      );
    }
  };

  // ─────────────────────────────────────────────────────────
  // Staff login
  // ─────────────────────────────────────────────────────────

  const handleStaffSubmit = async (
    values: StaffLoginValues
  ) => {
    setStaffError(null);

    try {
      const { data } = await api.post<
        ApiSuccess<StaffLoginResponse>
      >('/auth/staff-login', {
        restaurantCode: values.restaurantCode,
        pin: values.pin,
      });

      setAuth(
        data.data.accessToken,
        data.data.user,
        data.data.restaurant
      );

      toast.success(
        `Welcome, ${data.data.user.firstName}!`
      );

      router.push(
        getRedirectPath(data.data.user.role)
      );
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
      {/* Left panel */}
      <div className="flex flex-col px-6 py-8 lg:px-16 lg:py-12">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 grid place-items-center rounded-md bg-accent">
            <span className="text-[11px] font-bold text-white">
              S
            </span>
          </div>

          <div className="text-[13px] font-semibold tracking-tight">
            SpiceOS
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[380px]">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">
                Sign in
              </h1>

              <p className="text-[13px] text-fg-muted mt-1.5">
                Welcome back. Choose your login method
                below.
              </p>
            </div>

            {/* Tabs */}
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

            {/* Forms */}
            {activeTab === AUTH_TABS.ADMIN ? (
              <AdminLoginForm
                onSubmit={handleAdminSubmit}
                serverError={adminError}
              />
            ) : (
              <StaffLoginForm
                onSubmit={handleStaffSubmit}
                serverError={staffError}
              />
            )}

            {/* Register CTA */}
            {activeTab === AUTH_TABS.ADMIN && (
              <div className="mt-5 rounded-lg border border-border bg-surface px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-medium text-fg">
                    New restaurant?
                  </p>

                  <p className="text-[11px] text-fg-muted">
                    Get set up in under a minute.
                  </p>
                </div>

                <Link href="/register">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-md border border-border bg-bg px-3 py-1.5 text-[12px] font-medium text-fg hover:bg-surface-3 transition-colors whitespace-nowrap"
                  >
                    <Store className="h-3 w-3" />
                    Register
                  </button>
                </Link>
              </div>
            )}

            <p className="mt-6 text-[11px] text-fg-subtle text-center">
              Protected area. Unauthorized access is
              monitored and logged.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-fg-subtle">
          <span>© 2026 SpiceOS</span>

          <div className="flex items-center gap-4">
            <a className="hover:text-fg-muted cursor-pointer">
              Privacy
            </a>

            <a className="hover:text-fg-muted cursor-pointer">
              Terms
            </a>

            <a className="hover:text-fg-muted cursor-pointer">
              Status
            </a>
          </div>
        </div>
      </div>

      {/* Right visual panel */}
      <div className="hidden lg:flex relative overflow-hidden border-l border-border bg-surface">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--fg)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--fg)) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-bg/40 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-1.5 text-[11px] text-fg-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success live-dot" />

            <span className="uppercase tracking-wider font-medium">
              All systems operational
            </span>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-semibold">
                Kitchen operations, simplified
              </div>

              <h2 className="text-3xl font-semibold tracking-tight text-fg max-w-md leading-[1.15]">
                The operating system for modern
                restaurants.
              </h2>

              <p className="text-[13px] text-fg-muted max-w-sm leading-relaxed">
                Real-time KDS, order routing, menu
                control and live analytics — built for
                speed on the line.
              </p>
            </div>
          </div>

          <div
            className="text-[11px] text-fg-subtle"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}