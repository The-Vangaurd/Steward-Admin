'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ─── Schema ───────────────────────────────────────────────────────────────────

const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

export type AdminLoginValues = z.infer<typeof adminLoginSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminLoginFormProps {
  onSubmit: (values: AdminLoginValues) => Promise<void>;
  serverError: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminLoginForm({ onSubmit, serverError }: AdminLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { rememberMe: false },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="admin-email" className="text-[12px] font-medium text-fg-muted">
          Email
        </Label>
        <Input
          id="admin-email"
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
        <div className="flex items-center justify-between">
          <Label htmlFor="admin-password" className="text-[12px] font-medium text-fg-muted">
            Password
          </Label>
          <Link
            href="/forgot-password"
            className="text-[11px] text-fg-subtle hover:text-fg transition-colors"
            tabIndex={-1}
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="admin-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            className="pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-md text-fg-subtle hover:bg-surface-3 hover:text-fg-muted transition-colors"
          >
            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-[11px] text-danger mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Remember me */}
      <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          className="h-3.5 w-3.5 rounded border-border accent-accent cursor-pointer"
          {...register('rememberMe')}
        />
        <span className="text-[12px] text-fg-muted">Remember me</span>
      </label>

      {/* Server error */}
      {serverError && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-[12px] text-danger">
          {serverError}
        </div>
      )}

      {/* Submit */}
      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full mt-2">
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Sign in <ArrowRight className="h-3.5 w-3.5" />
          </>
        )}
      </Button>
    </form>
  );
}
