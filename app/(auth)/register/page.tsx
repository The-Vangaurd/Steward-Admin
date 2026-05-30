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

// ─── Google Icon ──────────────────────────────────────────────────────────────

const GOOGLE_ICON = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const handleGoogleRegister = () => {
    setGoogleLoading(true);
    const base =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/v\d+\/?$/, '') ??
      'http://localhost:4000';
    // intent=register → backend creates ADMIN user without restaurant,
    // then redirects to /register/restaurant-setup#tokens=...
    window.location.href = `${base}/v1/auth/google?intent=register`;
  };

  const onSubmit = async (values: RegisterForm) => {
    setServerError(null);
    try {
      const { data } = await api.post<ApiSuccess<OwnerRegisterResponse & { emailVerified?: boolean }>>('/auth/owner-register', {
        ...values,
        phone: '',
      });

      if (data.data.emailVerified === false) {
        setRegisteredEmail(values.email);
        toast.success('Verification email sent! Please check your inbox.');
        return;
      }

      setAuth(
        data.data.accessToken!,
        { ...data.data.user, restaurantId: data.data.user.restaurantId } as any,
        data.data.restaurant!,
      );

      toast.success(`Welcome! "${data.data.restaurant!.name}" is ready.`);
      router.push('/dashboard');
    } catch (err: any) {
      setServerError(
        err?.response?.data?.error?.message ??
          err?.response?.data?.message ??
          'Registration failed. Please try again.',
      );
    }
  };

  if (registeredEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-fg px-4">
        <div className="w-full max-w-[400px] rounded-2xl border border-border bg-surface p-8 shadow-sm space-y-6 text-center">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="h-12 w-12 rounded-full bg-accent/10 grid place-items-center">
              <Store className="h-6 w-6 text-accent animate-pulse" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Verify your email</h1>
            <p className="text-[13px] text-fg-muted leading-relaxed">
              We&apos;ve sent a verification link to <span className="text-fg font-medium font-mono">{registeredEmail}</span>.
            </p>
            <p className="text-[12px] text-fg-subtle leading-relaxed">
              Please click the link in the email to activate your account. Once verified, you&apos;ll be able to sign in.
            </p>
            <div className="w-full pt-4 space-y-3">
              <Link href="/login" className="block w-full">
                <Button size="lg" className="w-full cursor-pointer">
                  Go to Sign In <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <button
                onClick={() => setRegisteredEmail(null)}
                className="text-[12px] text-fg-muted hover:text-fg underline underline-offset-2 transition-colors cursor-pointer"
              >
                Back to sign up
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="text-[13px] font-semibold tracking-tight">Steward</div>
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

            {/* Google sign-up — primary CTA */}
            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={googleLoading || isSubmitting}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] font-medium text-fg hover:bg-surface-2 hover:border-border-strong transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-5"
            >
              {googleLoading ? (
                <span className="h-4 w-4 rounded-full border-2 border-fg-subtle/30 border-t-fg-subtle animate-spin" />
              ) : (
                GOOGLE_ICON
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-fg-subtle font-medium uppercase tracking-widest">
                or register with email
              </span>
              <div className="flex-1 h-px bg-border" />
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

              <Button type="submit" size="lg" disabled={isSubmitting || googleLoading} className="w-full mt-2">
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
          <span>© {new Date().getFullYear()} Steward</span>
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
