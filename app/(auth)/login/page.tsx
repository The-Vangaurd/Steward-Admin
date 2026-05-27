'use client';

import { Suspense } from 'react';
import LoginPageContent from './LoginPageContent';

export const dynamic = 'force-dynamic';

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-fg">
      <div className="text-sm text-fg-muted">Loading...</div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}