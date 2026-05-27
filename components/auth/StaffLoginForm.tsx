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
        {errors.restaurantCode && (
          <p className="text-[11px] text-danger mt-1">{errors.restaurantCode.message}</p>
        )}
        <p className="text-[11px] text-fg-subtle">
          Ask your manager for the restaurant code shown on your setup card.
        </p>
      </div>

      {/* PIN */}
      <div className="space-y-2">
        <Label className="text-[12px] font-medium text-fg-muted block text-center">
          Enter your 4-digit PIN
        </Label>
        {/* Hidden input for form validation */}
        <input type="hidden" {...register('pin')} />
        <PinPad value={pinValue} onChange={handlePinChange} disabled={isSubmitting} />
        {errors.pin && (
          <p className="text-[11px] text-danger mt-1 text-center">{errors.pin.message}</p>
        )}
      </div>

      {/* Server error */}
      {serverError && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-[12px] text-danger text-center">
          {serverError}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting || pinValue.length < 4}
        className="w-full"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Clock in <ArrowRight className="h-3.5 w-3.5" />
          </>
        )}
      </Button>
    </form>
  );
}
