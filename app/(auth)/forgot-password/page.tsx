"use client";
// Stub page so the "Forgot password?" link in AdminLoginForm doesn't 404.
// Replace with real password-reset implementation when the backend supports it.

import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg text-fg px-6">
      <div className="w-full max-w-[380px] text-center space-y-4">
        <div className="h-10 w-10 mx-auto grid place-items-center rounded-lg bg-surface-2 border border-border">
          <span className="text-lg">✉️</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Password reset</h1>
        <p className="text-[13px] text-fg-muted">
          Password reset is not yet available. Please contact your system administrator to reset your password.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-[13px] font-medium text-fg hover:bg-surface-2 transition-colors"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
