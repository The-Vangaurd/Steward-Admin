"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff, ArrowRight, Store } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth.store";
import api from "@/lib/axios";
import type { ApiSuccess, LoginResponse } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginForm = z.infer<typeof loginSchema>;

function getRedirectPath(role: string): string {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "/dashboard";
  if (role === "KITCHEN_STAFF") return "/kitchen";
  if (role === "WAITER") return "/kitchen";   // WAITERs use kitchen view for now
  return "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const { accessToken, user, setAuth } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (accessToken && user) {
      router.replace(getRedirectPath(user.role));
    }
  }, [accessToken, user, router]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginForm) => {
    setServerError(null);

    try {
      const { data } = await api.post<ApiSuccess<LoginResponse>>(
        "/auth/login",
        { email: values.email, password: values.password }
      );
      setAuth(data.data.accessToken, data.data.user);
      toast.success("Signed in successfully");
      router.push(getRedirectPath(data.data.user.role));
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.error?.message ??
        "Invalid email or password";
      setServerError(message);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-bg text-fg">
      {/* Left: form */}
      <div className="flex flex-col px-6 py-8 lg:px-16 lg:py-12">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 grid place-items-center rounded-md bg-accent">
            <span className="text-[11px] font-bold text-white">S</span>
          </div>
          <div className="text-[13px] font-semibold tracking-tight">SpiceOS</div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[380px]">
            <div className="mb-7">
              <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
              <p className="text-[13px] text-fg-muted mt-1.5">Welcome back. Enter your credentials to continue.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[12px] font-medium text-fg-muted">Email</Label>
                <Input id="email" type="email" placeholder="you@restaurant.com" autoComplete="email" {...register("email")} />
                {errors.email && <p className="text-[11px] text-danger mt-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[12px] font-medium text-fg-muted">Password</Label>
                  <a className="text-[11px] text-fg-subtle hover:text-fg cursor-pointer">Forgot?</a>
                </div>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" autoComplete="current-password" className="pr-10" {...register("password")} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-md text-fg-subtle hover:bg-surface-3 hover:text-fg-muted">
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-danger mt-1">{errors.password.message}</p>}
              </div>

              {serverError && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-[12px] text-danger">{serverError}</div>
              )}

              <Button type="submit" size="lg" disabled={isSubmitting} className="w-full mt-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Sign in <ArrowRight className="h-3.5 w-3.5" /></>)}
              </Button>
            </form>

            <div className="mt-5 rounded-lg border border-border bg-surface px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-medium text-fg">New restaurant?</p>
                <p className="text-[11px] text-fg-muted">Get set up in under a minute.</p>
              </div>
              <Link href="/register">
                <button type="button" className="flex items-center gap-1.5 rounded-md border border-border bg-bg px-3 py-1.5 text-[12px] font-medium text-fg hover:bg-surface-3 transition-colors whitespace-nowrap">
                  <Store className="h-3 w-3" />
                  Register
                </button>
              </Link>
            </div>

            <p className="mt-6 text-[11px] text-fg-subtle text-center">
              Protected area. Unauthorized access is monitored and logged.
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

      {/* Right: visual panel */}
      <div className="hidden lg:flex relative overflow-hidden border-l border-border bg-surface">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "linear-gradient(hsl(var(--fg)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--fg)) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-bg/40 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-1.5 text-[11px] text-fg-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success live-dot" />
            <span className="uppercase tracking-wider font-medium">All systems operational</span>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-semibold">Kitchen operations, simplified</div>
              <h2 className="text-3xl font-semibold tracking-tight text-fg max-w-md leading-[1.15]">
                The operating system for modern restaurants.
              </h2>
              <p className="text-[13px] text-fg-muted max-w-sm leading-relaxed">
                Real-time KDS, order routing, menu control and live analytics — built for speed on the line.
              </p>
            </div>

            {/* Mock KDS preview */}
            <div className="grid grid-cols-2 gap-2.5 max-w-md">
              {[
                { n: "#A-1042", t: "02:14", s: "warning", l: "Prep" },
                { n: "#A-1043", t: "00:48", s: "info", l: "New" },
                { n: "#A-1041", t: "05:21", s: "danger", l: "Late" },
                { n: "#A-1040", t: "Ready", s: "success", l: "Ready" },
              ].map((o, i) => (
                <div key={i} className="rounded-lg border border-border bg-bg/60 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold num">{o.n}</span>
                    <span className={`text-[10px] uppercase font-semibold tracking-wider ${
                      o.s === "warning" ? "text-warning" :
                      o.s === "info" ? "text-info" :
                      o.s === "danger" ? "text-danger" : "text-success"
                    }`}>{o.l}</span>
                  </div>
                  <div className="text-[10px] text-fg-subtle num">{o.t}</div>
                  <div className="mt-2 space-y-1">
                    <div className="h-1 rounded-full bg-surface-3" />
                    <div className="h-1 rounded-full bg-surface-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-fg-subtle">
            Trusted by kitchens running <span className="text-fg-muted font-medium num">2.4M+</span> orders / month.
          </div>
        </div>
      </div>
    </div>
  );
}
