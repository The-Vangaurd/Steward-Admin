'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';

export default function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('Verifying your email address...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    const verify = async () => {
      try {
        const { data } = await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(data?.data?.message || data?.message || 'Email verified successfully. You can now log in.');
      } catch (err: any) {
        setStatus('error');
        setMessage(
          err?.response?.data?.error?.message ??
          err?.response?.data?.message ??
          'Verification failed. The link may have expired or is invalid.'
        );
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-fg px-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-8 shadow-sm space-y-6 text-center">
        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
            <h1 className="text-xl font-semibold tracking-tight">Verifying Email</h1>
            <p className="text-[13px] text-fg-muted leading-relaxed">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <CheckCircle2 className="h-12 w-12 text-success animate-bounce" />
            <h1 className="text-xl font-semibold tracking-tight">Verification Success</h1>
            <p className="text-[13px] text-fg-muted leading-relaxed">{message}</p>
            <Link href="/login" className="w-full pt-2">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-accent text-white px-4 py-2.5 text-[13px] font-semibold hover:bg-accent/90 transition-all cursor-pointer"
              >
                Go to Sign In <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <XCircle className="h-12 w-12 text-danger" />
            <h1 className="text-xl font-semibold tracking-tight">Verification Failed</h1>
            <p className="text-[13px] text-danger leading-relaxed">{message}</p>
            <Link href="/register" className="w-full pt-2">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-border bg-bg text-fg px-4 py-2.5 text-[13px] font-semibold hover:bg-surface-2 transition-all cursor-pointer"
              >
                Back to Registration
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
