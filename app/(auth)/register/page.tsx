'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff, ArrowRight, Store, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/axios';
import type { ApiSuccess } from '@/types';

// ─── Validation ───────────────────────────────────────────────────────────────
// Reduced friction: phone removed (can be added later in Settings > General).
// Backend ownerRegisterSchema still requires phone — we send an empty optional
// value so the schema stays backward-compatible.

const registerSchema = z.object({
  restaurantName: z.string().min(2, 'Restaurant name must be at least 2 characters').max(255),
  ownerName: z.string().min(2, 'Your name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
});

type RegisterForm = z.infer<typeof registerSchema>;

interface OwnerRegisterResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    restaurantId: string;
  };
  restaurant: {
    id: string;
    name: string;
    slug: string;
    restaurantCode: string;
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterForm) => {
    setServerError(null);
    try {
      const { data } = await api.post<ApiSuccess<OwnerRegisterResponse>>('/auth/owner-register', {
        ...values,
        // phone is optional on backend — can be set later in Settings
        phone: '',
      });

      setAuth(
        data.data.accessToken,
        { ...data.data.user, restaurantId: data.data.user.restaurantId } as any,
        data.data.restaurant,
      );

      toast.success(`Welcome! "${data.data.restaurant.name}" is ready.`);
      router.push('/dashboard');
    } catch (err: any) {
      setServerError(
        err?.response?.data?.error?.message ??
          err?.response?.data?.message ??
          'Registration failed. Please try again.',
      );
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-bg text-fg">
      {/* ── Left: form ── */}
      <div className="flex flex-col px-6 py-8 lg:px-16 lg:py-12">
        {/* Brand */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 grid place-items-center rounded-md bg-accent">
              <span className="text-[11px] font-bold text-white">S</span>
            </div>
            <div className="text-[13px] font-semibold tracking-tight">SpiceOS</div>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-1 text-[12px] text-fg-muted hover:text-fg transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
            Back to sign in
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[400px]">
            <div className="mb-7">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 mb-3">
                <Store className="h-3 w-3 text-accent" />
                <span className="text-[11px] text-fg-muted font-medium">Restaurant owner</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">Create your restaurant</h1>
              <p className="text-[13px] text-fg-muted mt-1.5">
                Get started in under a minute. No credit card required.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Restaurant name */}
              <div className="space-y-1.5">
                <Label htmlFor="restaurantName" className="text-[12px] font-medium text-fg-muted">
                  Restaurant name
                </Label>
                <Input
                  id="restaurantName"
                  placeholder="The Spice Garden"
                  autoComplete="organization"
                  {...register('restaurantName')}
                />
                {errors.restaurantName && (
                  <p className="text-[11px] text-danger mt-1">{errors.restaurantName.message}</p>
                )}
              </div>

              {/* Owner name */}
              <div className="space-y-1.5">
                <Label htmlFor="ownerName" className="text-[12px] font-medium text-fg-muted">
                  Your name
                </Label>
                <Input
                  id="ownerName"
                  placeholder="Priya Sharma"
                  autoComplete="name"
                  {...register('ownerName')}
                />
                {errors.ownerName && (
                  <p className="text-[11px] text-danger mt-1">{errors.ownerName.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-email" className="text-[12px] font-medium text-fg-muted">
                  Email
                </Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@restaurant.com"
                  autoComplete="email"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-[11px] text-danger mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-password" className="text-[12px] font-medium text-fg-muted">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    autoComplete="new-password"
                    className="pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-md text-fg-subtle hover:bg-surface-3 hover:text-fg-muted"
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-danger mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Server error */}
              {serverError && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-[12px] text-danger">
                  {serverError}
                </div>
              )}

              <Button type="submit" size="lg" disabled={isSubmitting} className="w-full mt-2">
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Create restaurant <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-4 text-[11px] text-fg-subtle text-center">
              By registering you agree to our{' '}
              <a className="hover:text-fg-muted cursor-pointer underline underline-offset-2">
                Terms of Service
              </a>{' '}
              and{' '}
              <a className="hover:text-fg-muted cursor-pointer underline underline-offset-2">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-fg-subtle">
          <span>© {new Date().getFullYear()} SpiceOS</span>
          <div className="flex items-center gap-4">
            <a className="hover:text-fg-muted cursor-pointer">Privacy</a>
            <a className="hover:text-fg-muted cursor-pointer">Terms</a>
            <a className="hover:text-fg-muted cursor-pointer">Status</a>
          </div>
        </div>
      </div>

      {/* ── Right: visual panel ── */}
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
            <span className="uppercase tracking-wider font-medium">All systems operational</span>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-semibold">
                Set up once. Run forever.
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-fg max-w-md leading-[1.15]">
                Your restaurant, live in minutes.
              </h2>
              <p className="text-[13px] text-fg-muted max-w-sm leading-relaxed">
                One registration creates your restaurant profile, your admin account, and unlocks
                full KDS, menu management, staff tools, and real-time analytics.
              </p>
            </div>

            <div className="space-y-2 max-w-sm">
              {[
                { icon: '✦', label: 'Kitchen Display System — real-time order routing' },
                { icon: '✦', label: 'Menu & availability management' },
                { icon: '✦', label: 'Staff onboarding with role-based access' },
                { icon: '✦', label: 'Live analytics and revenue tracking' },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-[10px] text-accent mt-0.5 shrink-0">{f.icon}</span>
                  <span className="text-[12px] text-fg-muted">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-fg-subtle" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
