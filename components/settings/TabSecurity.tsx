"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ShieldCheck, Trash2, KeyRound, MonitorSmartphone, Loader2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth.store";
import { listSessions, revokeAllSessions, revokeSession, ActiveSession } from "@/lib/session/sessions";
import type { User } from "@/types";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Use at least 8 characters")
    .regex(/[A-Z]/, "Add an uppercase letter")
    .regex(/[0-9]/, "Add a number"),
});

const setPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Use at least 8 characters")
      .regex(/[A-Z]/, "Add an uppercase letter")
      .regex(/[0-9]/, "Add a number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordValues = z.infer<typeof passwordSchema>;
type SetPasswordValues = z.infer<typeof setPasswordSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deviceName(userAgent?: string | null) {
  if (!userAgent) return "Unknown device";
  if (userAgent.includes("Windows")) return "Windows browser";
  if (userAgent.includes("Mac")) return "Mac browser";
  if (userAgent.includes("Android")) return "Android browser";
  if (userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS browser";
  return "Browser session";
}

// ─── Set Password section (for OAuth / Google-only users) ─────────────────────

function SetPasswordSection({ user }: { user: User | null }) {
  const isOAuthUser = user?.authProvider === "google";

  const form = useForm<SetPasswordValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const handleSetPassword = async (values: SetPasswordValues) => {
    try {
      await api.post("/auth/set-password", { newPassword: values.newPassword });
      toast.success("Password set! You can now use email + password to sign in.");
      form.reset();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to set password");
    }
  };

  if (!isOAuthUser) return null;

  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-1 flex items-center gap-2">
        <Lock className="h-4 w-4 text-accent" />
        <h2 className="text-[13px] font-semibold">Set a password</h2>
      </div>
      <p className="text-[12px] text-fg-subtle mb-4">
        Your account was created via Google. Set a password to also sign in with email and password.
      </p>
      <form onSubmit={form.handleSubmit(handleSetPassword)} className="grid gap-3 sm:max-w-md">
        <div className="space-y-1.5">
          <Label htmlFor="sp-new">New password</Label>
          <Input id="sp-new" type="password" {...form.register("newPassword")} />
          {form.formState.errors.newPassword && (
            <p className="text-[11px] text-danger">{form.formState.errors.newPassword.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sp-confirm">Confirm password</Label>
          <Input id="sp-confirm" type="password" {...form.register("confirmPassword")} />
          {form.formState.errors.confirmPassword && (
            <p className="text-[11px] text-danger">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-fit">
          {form.formState.isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          Set password
        </Button>
      </form>
    </section>
  );
}

// ─── Change Password section (email/password users) ───────────────────────────

function ChangePasswordSection({ user }: { user: User | null }) {
  const isOAuthOnly = user?.authProvider === "google";

  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    try {
      await api.post("/auth/forgot-password", { email: user.email });
      toast.success("Password reset email sent — check your inbox.");
    } catch {
      toast.error("Failed to send reset email. Try again.");
    }
  };

  const changePassword = async (values: PasswordValues) => {
    try {
      await api.post("/auth/change-password", values);
      toast.success("Password changed. Please sign in again.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to change password");
    }
  };

  if (isOAuthOnly) return null;

  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-fg-subtle" />
          <h2 className="text-[13px] font-semibold">Change password</h2>
        </div>
        <button
          type="button"
          onClick={handleSendResetEmail}
          className="text-[11px] text-accent hover:text-accent/80 underline underline-offset-2 transition-colors"
        >
          Forgot password? Send reset email
        </button>
      </div>
      <form onSubmit={form.handleSubmit(changePassword)} className="grid gap-3 sm:max-w-md">
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input id="currentPassword" type="password" {...form.register("currentPassword")} />
          {form.formState.errors.currentPassword && (
            <p className="text-[11px] text-danger">{form.formState.errors.currentPassword.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="newPassword">New password</Label>
          <Input id="newPassword" type="password" {...form.register("newPassword")} />
          {form.formState.errors.newPassword && (
            <p className="text-[11px] text-danger">{form.formState.errors.newPassword.message}</p>
          )}
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-fit">
          {form.formState.isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          Update password
        </Button>
      </form>
    </section>
  );
}

// ─── Email verification banner ────────────────────────────────────────────────

function EmailVerificationBanner({ user }: { user: User | null }) {
  if (!user || user.emailVerified !== false) return null;

  const handleResend = async () => {
    try {
      await api.post("/auth/resend-verification", { email: user.email });
      toast.success("Verification email sent — check your inbox.");
    } catch {
      toast.error("Could not send verification email.");
    }
  };

  return (
    <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/8 px-4 py-3">
      <Mail className="h-4 w-4 text-warning mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-warning">Email not verified</p>
        <p className="text-[12px] text-fg-muted mt-0.5">
          Verify <span className="font-medium">{user.email}</span> to keep your account secure.
        </p>
      </div>
      <button
        type="button"
        onClick={handleResend}
        className="shrink-0 text-[11px] font-semibold text-warning underline underline-offset-2 whitespace-nowrap"
      >
        Resend email
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TabSecurity() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const user = useAuthStore((s) => s.user);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["auth-sessions"],
    queryFn: listSessions,
  });

  const revoke = useMutation({
    mutationFn: revokeSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth-sessions"] });
      toast.success("Session revoked");
    },
    onError: () => toast.error("Could not revoke session"),
  });

  const logoutAll = useMutation({
    mutationFn: revokeAllSessions,
    onSuccess: () => {
      clearAuth();
      toast.success("All sessions revoked");
      window.location.href = "/login";
    },
    onError: () => toast.error("Could not revoke all sessions"),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 space-y-5">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-md border border-border bg-surface">
          <ShieldCheck className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight">Security</h1>
          <p className="text-[12px] text-fg-subtle">Manage your account password, verification, and active sessions.</p>
        </div>
      </div>

      {/* Email verification banner */}
      <EmailVerificationBanner user={user} />

      {/* Set password (Google/OAuth users only) */}
      <SetPasswordSection user={user} />

      {/* Change password (email/password users only) */}
      <ChangePasswordSection user={user} />

      {/* Active sessions */}
      <section className="rounded-lg border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <MonitorSmartphone className="h-4 w-4 text-fg-subtle" />
            <h2 className="text-[13px] font-semibold">Active sessions</h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={logoutAll.isPending || sessions.length === 0}
            onClick={() => logoutAll.mutate()}
          >
            {logoutAll.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Logout all
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 px-4 py-8 text-[12px] text-fg-subtle">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading sessions
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sessions.map((session: ActiveSession) => (
              <div key={session.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-fg">{deviceName(session.userAgent)}</p>
                  {session.isCurrent && (
                    <p className="mt-0.5 text-[11px] font-medium text-accent">Current device</p>
                  )}
                  <p className="mt-0.5 text-[11px] text-fg-subtle">
                    {session.ipAddress ?? "Unknown IP"} · last used{" "}
                    {session.lastUsedAt
                      ? formatDistanceToNow(new Date(session.lastUsedAt), { addSuffix: true })
                      : "recently"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={revoke.isPending || session.isCurrent}
                  onClick={() => revoke.mutate(session.id)}
                  title={
                    session.isCurrent
                      ? "Use 'Logout all' to end this session"
                      : "Revoke session"
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Revoke
                </Button>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="px-4 py-8 text-[12px] text-fg-subtle">No active sessions.</div>
            )}
          </div>
        )}
      </section>

      {/* Danger Zone */}
      <section className="rounded-lg border border-danger/30 bg-danger/5">
        <div className="flex items-center gap-2 border-b border-danger/20 px-4 py-3">
          <span className="text-[13px] font-semibold text-danger">Danger Zone</span>
        </div>
        <div className="divide-y divide-danger/10">

          {/* Export data */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-fg">Export restaurant data</p>
              <p className="text-[11px] text-fg-subtle mt-0.5">
                Download all your orders, menu items, and settings as a JSON file.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const { data } = await api.get("/admin/export");
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `steward-export-${new Date().toISOString().slice(0, 10)}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success("Data exported successfully");
                } catch {
                  toast.error("Export failed — try again");
                }
              }}
              className="shrink-0"
            >
              Export data
            </Button>
          </div>

          {/* Reset settings */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-fg">Reset all settings</p>
              <p className="text-[11px] text-fg-subtle mt-0.5">
                Restore all settings to their default values. Your menu and orders are not affected.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm("Reset all settings to defaults? This cannot be undone.")) {
                  api
                    .post("/admin/settings/reset")
                    .then(() => {
                      toast.success("Settings reset to defaults");
                      window.location.reload();
                    })
                    .catch(() => toast.error("Reset failed — try again"));
                }
              }}
              className="shrink-0 border-danger/30 text-danger hover:bg-danger/10 hover:border-danger/50"
            >
              Reset settings
            </Button>
          </div>

        </div>
      </section>
    </div>
  );
}
