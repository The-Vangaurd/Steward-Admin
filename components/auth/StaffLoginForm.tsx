'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowRight, Delete } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ─── Schema ───────────────────────────────────────────────────────────────────

const staffLoginSchema = z.object({
  restaurantCode: z
    .string()
    .min(3, 'Restaurant code is required')
    .max(20)
    .transform((v) => v.toUpperCase()),
  pin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d{4}$/, 'Digits only'),
});

export type StaffLoginValues = z.infer<typeof staffLoginSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface StaffLoginFormProps {
  onSubmit: (values: StaffLoginValues) => Promise<void>;
  serverError: string | null;
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

// ─── PIN pad ──────────────────────────────────────────────────────────────────

const PIN_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

interface PinPadProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

function PinPad({ value, onChange, disabled }: PinPadProps) {
  const MAX = 4;

  const press = (key: string) => {
    if (disabled) return;
    if (key === 'del') {
      onChange(value.slice(0, -1));
    } else if (value.length < MAX) {
      onChange(value + key);
    }
  };

  return (
    <div className="space-y-3">
      {/* PIN display */}
      <div className="flex justify-center gap-3">
        {Array.from({ length: MAX }).map((_, i) => (
          <div
            key={i}
            className={`h-10 w-10 rounded-lg border flex items-center justify-center transition-all ${
              i < value.length
                ? 'border-accent bg-accent/10'
                : 'border-border bg-surface'
            }`}
          >
            {i < value.length ? (
              <div className="h-2.5 w-2.5 rounded-full bg-accent" />
            ) : null}
          </div>
        ))}
      </div>

      {/* Number grid */}
      <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
        {PIN_KEYS.map((key, idx) => {
          if (key === '') {
            return <div key={idx} />;
          }
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => press(key)}
              className={`h-12 rounded-xl border border-border text-[16px] font-semibold transition-all
                ${key === 'del'
                  ? 'text-fg-muted hover:bg-danger/10 hover:border-danger/30 hover:text-danger flex items-center justify-center'
                  : 'text-fg hover:bg-surface-3 active:scale-95'
                }
                disabled:opacity-40 disabled:cursor-not-allowed bg-surface`}
              aria-label={key === 'del' ? 'Delete' : key}
            >
              {key === 'del' ? <Delete className="h-4 w-4 mx-auto" /> : key}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StaffLoginForm({ onSubmit, serverError }: StaffLoginFormProps) {
  const [pinValue, setPinValue] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StaffLoginValues>({
    resolver: zodResolver(staffLoginSchema),
    defaultValues: { restaurantCode: '', pin: '' },
  });

  const handlePinChange = (v: string) => {
    setPinValue(v);
    setValue('pin', v, { shouldValidate: v.length === 4 });
  };

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    const base =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/v\d+\/?$/, '') ??
      'http://localhost:4000';
    window.location.href = `${base}/v1/auth/google?role=staff`;
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5" noValidate>
      {/* Restaurant code */}
      <div className="space-y-1.5">
        <Label htmlFor="restaurant-code" className="text-[12px] font-medium text-fg-muted">
          Restaurant code
        </Label>
        <Input
          id="restaurant-code"
          type="text"
          placeholder="e.g. ABC123"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={20}
          className="uppercase tracking-widest font-mono text-center text-[15px]"
          {...register('restaurantCode')}
        />
