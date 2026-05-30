'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowRight, Store, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/axios';
import type { ApiSuccess } from '@/types';

// ─── Validation ───────────────────────────────────────────────────────────────

const setupSchema = z.object({
  restaurantName: z.string().min(2, 'Restaurant name must be at least 2 characters').max(255),
  ownerName: z.string().min(2, 'Your name must be at least 2 characters').max(100),
});

type SetupForm = z.infer<typeof setupSchema>;

interface RestaurantSetupResponse {
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

export default function RestaurantSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, accessToken: existingToken } = useAuthStore();

  const [serverError, setServerError] = useState<string | null>(null);
  const [oauthToken, setOauthToken] = useState<string | null>(null);
  const [prefillEmail, setPrefillEmail] = useState<string>('');
  const [prefillName, setPrefillName] = useState<string>('');

  // Exchange OAuth code for accessToken
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const code = searchParams.get('code');
    if (!code) return;

    const handleExchange = async () => {
      try {
        const { data } = await api.post<ApiSuccess<{ accessToken: string; user: any }>>(
          '/auth/exchange',
          { code }
        );

        const token = data.data.accessToken;
        setOauthToken(token);

        const payloadBase64 = token.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));

        setPrefillEmail(payload.email ?? '');
        if (payload.firstName) {
          const fullName = [payload.firstName, payload.lastName].filter(Boolean).join(' ');
          setPrefillName(fullName);
        }

        // Scrub code from the browser URL immediately
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('code');
        history.replaceState(null, '', newUrl.toString());

      } catch (err: any) {
        toast.error('Session expired — please try again');
        router.replace('/register');
      }
    };

    handleExchange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // If someone lands here without an OAuth token and without being logged in, redirect away
  useEffect(() => {
    if (!oauthToken && !existingToken) {
      // Give the hash-parse effect time to run first
      const t = setTimeout(() => {
        if (!oauthToken) router.replace('/register');
      }, 300);
      return () => clearTimeout(t);
    }
  }, [oauthToken, existingToken, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
    values: { restaurantName: '', ownerName: prefillName },
  });

  const onSubmit = async (values: SetupForm) => {
    setServerError(null);
    try {
      // Call owner-register with the Google access token as bearer auth
      // Password is omitted — the backend accepts passwordless registration
      // when a valid OAuth-issued JWT is present
      const { data } = await api.post<ApiSuccess<RestaurantSetupResponse>>(
        '/auth/owner-register',
        {
          restaurantName: values.restaurantName,
          ownerName: values.ownerName,
          email: prefillEmail,
          phone: '',
          // Signal to backend that this is an OAuth registration (no password)
          oauthToken: oauthToken,
        },
        oauthToken
          ? { headers: { Authorization: `Bearer ${oauthToken}` } }
          : undefined,
      );

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
          'Setup failed. Please try again.',
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
            <div className="text-[13px] font-semibold tracking-tight">Steward</div>
          </div>
          <Link
            href="/register"
            className="flex items-center gap-1 text-[12px] text-fg-muted hover:text-fg transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
            Back
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[400px]">
            {/* Header */}
            <div className="mb-7">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 mb-3">
                <Store className="h-3 w-3 text-accent" />
                <span className="text-[11px] text-fg-muted font-medium">Step 2 of 2</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">Set up your restaurant</h1>
              <p className="text-[13px] text-fg-muted mt-1.5">
                You&apos;re signed in as{' '}
                <span className="text-fg font-medium">{prefillEmail || 'your Google account'}</span>.
                Just a few more details.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
              <a href="#" aria-label="Terms of Service (coming soon)" className="hover:text-fg-muted underline underline-offset-2">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" aria-label="Privacy Policy (coming soon)" className="hover:text-fg-muted underline underline-offset-2">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-fg-subtle">
          <span>© {new Date().getFullYear()} Steward</span>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="Privacy policy (coming soon)" className="hover:text-fg-muted">Privacy</a>
            <a href="#" aria-label="Terms of service (coming soon)" className="hover:text-fg-muted">Terms</a>
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
            <span className="uppercase tracking-wider font-medium">Almost there</span>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-semibold">
                One last step
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-fg max-w-md leading-[1.15]">
                Name your restaurant and go live.
              </h2>
              <p className="text-[13px] text-fg-muted max-w-sm leading-relaxed">
                Your restaurant slug and code will be auto-generated. You can customize everything
                later in settings.
              </p>
            </div>

            <div className="space-y-2 max-w-sm">
              {[
                { icon: '✓', label: 'Google account linked' },
                { icon: '✓', label: 'Admin account created' },
                { icon: '◎', label: 'Restaurant details — you are here' },
                { icon: '○', label: 'Dashboard ready' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span
                    className={`text-[11px] font-semibold shrink-0 ${
                      f.icon === '✓'
                        ? 'text-success'
                        : f.icon === '◎'
                        ? 'text-accent'
                        : 'text-fg-subtle/40'
                    }`}
                  >
                    {f.icon}
                  </span>
                  <span
                    className={`text-[12px] ${
                      f.icon === '✓'
                        ? 'text-fg-muted line-through'
                        : f.icon === '◎'
                        ? 'text-fg font-medium'
                        : 'text-fg-subtle/50'
                    }`}
                  >
                    {f.label}
                  </span>
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
