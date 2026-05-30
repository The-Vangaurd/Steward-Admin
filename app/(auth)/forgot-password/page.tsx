"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/axios";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSuccess(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Reset password</h1>
        <p className="text-[13px] text-fg-muted">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {success ? (
        <div className="rounded-xl border border-success/20 bg-success/5 p-4 flex flex-col items-center text-center space-y-3">
          <CheckCircle2 className="h-8 w-8 text-success" />
          <div>
            <h3 className="text-[14px] font-medium text-success">Check your email</h3>
            <p className="text-[13px] text-success/80 mt-1">
              We've sent a password reset link to {email}.
            </p>
          </div>
          <Button variant="outline" className="w-full mt-2" onClick={() => setSuccess(false)}>
            Try another email
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[12px] font-medium text-fg">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-fg-subtle" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !email}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send reset link
          </Button>
        </form>
      )}

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center text-[12px] text-fg-muted hover:text-fg transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-3 w-3" />
          Back to login
        </Link>
      </div>
    </div>
  );
}
