"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, RefreshCw, Pencil, UserX, Users, Loader2, Copy, Check,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import type { ApiSuccess, PaginationMeta, User } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffMember extends User {
  isActive: boolean;
  createdAt: string;
}

interface StaffResponse {
  data: StaffMember[];
  meta: PaginationMeta;
}

interface CreateStaffResponse extends StaffMember {
  temporaryPassword: string;
}

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "Required").max(50),
  lastName: z.string().min(1, "Required").max(50),
  phone: z.string().optional(),
  role: z.enum(["KITCHEN_STAFF", "WAITER"], {
    errorMap: () => ({ message: "Select a role" }),
  }),
});

const editSchema = z.object({
  firstName: z.string().min(1, "Required").max(50),
  lastName: z.string().min(1, "Required").max(50),
  phone: z.string().optional(),
  role: z.enum(["KITCHEN_STAFF", "WAITER", "ADMIN"]),
  isActive: z.boolean(),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  KITCHEN_STAFF: "Kitchen Staff",
  WAITER: "Waiter",
};

type BadgeVariant = "default" | "neutral" | "warning" | "info" | "success";

const ROLE_VARIANT: Record<string, BadgeVariant> = {
  SUPER_ADMIN: "default",
  ADMIN: "success",
  KITCHEN_STAFF: "warning",
  WAITER: "info",
};

// ─── Create Sheet ─────────────────────────────────────────────────────────────

function CreateStaffSheet({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({ resolver: zodResolver(createSchema) });

  const handleClose = () => {
    reset();
    setTempPassword(null);
    setCopied(false);
    onOpenChange(false);
  };

  const onSubmit = async (values: CreateForm) => {
    try {
      const { data } = await api.post<ApiSuccess<CreateStaffResponse>>(
        "/admin/staff",
        values
      );
      setTempPassword(data.data.temporaryPassword);
      toast.success(`${values.firstName} ${values.lastName} added to staff`);
      onCreated();
      reset();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? "Failed to create staff member";
      toast.error(message);
    }
  };

  const copyPassword = () => {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-5">
          <SheetTitle>Add Staff Member</SheetTitle>
        </SheetHeader>

        {tempPassword ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-success/30 bg-success/10 p-4 space-y-2">
              <p className="text-[13px] font-semibold text-fg">Account created</p>
              <p className="text-[12px] text-fg-muted">
                Share this temporary password with the new staff member. It will not be shown again.
              </p>
              <div className="flex items-center gap-2 mt-2 rounded-md border border-border bg-surface px-3 py-2">
                <code className="flex-1 text-[13px] font-mono text-fg select-all">
                  {tempPassword}
                </code>
                <button
                  onClick={copyPassword}
                  className="flex-shrink-0 text-fg-muted hover:text-fg transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => { setTempPassword(null); }}>
                Add Another
              </Button>
              <Button variant="secondary" className="flex-1" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[12px]">First Name *</Label>
                <Input {...register("firstName")} placeholder="Jane" />
                {errors.firstName && (
                  <p className="text-[11px] text-danger">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">Last Name *</Label>
                <Input {...register("lastName")} placeholder="Doe" />
                {errors.lastName && (
                  <p className="text-[11px] text-danger">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px]">Email *</Label>
              <Input type="email" {...register("email")} placeholder="jane@restaurant.com" />
              {errors.email && (
                <p className="text-[11px] text-danger">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px]">Phone</Label>
              <Input {...register("phone")} placeholder="+91 98765 43210" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px]">Role *</Label>
              <Select onValueChange={(v) => setValue("role", v as CreateForm["role"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KITCHEN_STAFF">Kitchen Staff</SelectItem>
                  <SelectItem value="WAITER">Waiter</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-[11px] text-danger">{errors.role.message}</p>
              )}
            </div>

            <div className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-[12px] text-fg-muted">
              A temporary password <span className="font-mono font-semibold text-fg">Welcome@123</span> will be set. Share it with the staff member after creation.
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create Account"
                )}
              </Button>
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Edit Sheet ───────────────────────────────────────────────────────────────

function EditStaffSheet({
  member,
  open,
  onOpenChange,
  onUpdated,
}: {
  member: StaffMember | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated: () => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    values: member
      ? {
          firstName: member.firstName,
          lastName: member.lastName,
          phone: member.phone ?? "",
          role: member.role as EditForm["role"],
          isActive: member.isActive,
        }
      : undefined,
  });

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const onSubmit = async (values: EditForm) => {
    if (!member) return;
    try {
      await api.patch(`/admin/staff/${member.id}`, values);
      toast.success("Staff member updated");
      onUpdated();
      handleClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to update staff member");
    }
  };

  if (!member) return null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-5">
          <SheetTitle>Edit Staff Member</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[12px]">First Name *</Label>
              <Input {...register("firstName")} />
              {errors.firstName && (
                <p className="text-[11px] text-danger">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Last Name *</Label>
              <Input {...register("lastName")} />
              {errors.lastName && (
                <p className="text-[11px] text-danger">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px]">Email</Label>
            <Input value={member.email} disabled className="opacity-60 cursor-not-allowed" />
            <p className="text-[11px] text-fg-subtle">Email cannot be changed</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px]">Phone</Label>
            <Input {...register("phone")} placeholder="+91 98765 43210" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px]">Role</Label>
            <Select
              defaultValue={member.role}
              onValueChange={(v) => setValue("role", v as EditForm["role"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KITCHEN_STAFF">Kitchen Staff</SelectItem>
                <SelectItem value="WAITER">Waiter</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px]">Status</Label>
            <Select
              defaultValue={member.isActive ? "true" : "false"}
              onValueChange={(v) => setValue("isActive", v === "true")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [deactivateMember, setDeactivateMember] = useState<StaffMember | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["staff", page],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<StaffMember[]> & { meta: PaginationMeta }>(
        "/admin/staff",
        { params: { page, limit: 20 } }
      );
      return data as unknown as StaffResponse;
    },
  });

  const staff = data?.data ?? [];
  const meta = data?.meta;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["staff"] });

  const handleDeactivate = async () => {
    if (!deactivateMember) return;
    setDeactivating(true);
    try {
      await api.delete(`/admin/staff/${deactivateMember.id}`);
      toast.success(`${deactivateMember.firstName} ${deactivateMember.lastName} deactivated`);
      invalidate();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to deactivate staff member");
    } finally {
      setDeactivating(false);
      setDeactivateMember(null);
    }
  };

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-4 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 pb-1">
        <div>
          <div className="label-xs mb-1">Administration</div>
          <h2 className="text-xl font-semibold tracking-tight text-fg">Staff</h2>
          <p className="text-[12px] text-fg-subtle mt-1 num">
            {meta
              ? `${meta.total.toLocaleString()} member${meta.total !== 1 ? "s" : ""} · Page ${meta.page} of ${meta.totalPages}`
              : "Loading…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["staff"] })}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Staff
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {isLoading ? (
          <div className="space-y-1.5 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-md bg-surface-2" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-fg-muted">Failed to load staff.</p>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 border border-border">
              <Users className="h-5 w-5 text-fg-subtle" />
            </div>
            <p className="text-[13px] font-medium text-fg">No staff members yet</p>
            <p className="text-[11px] text-fg-subtle">Add your first staff member to get started</p>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Staff
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-surface-2 hover:bg-surface-2">
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                    Name
                  </TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                    Email
                  </TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                    Role
                  </TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                    Status
                  </TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                    Last Login
                  </TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                    Joined
                  </TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow
                    key={member.id}
                    className="border-border hover:bg-surface-2 transition-colors"
                  >
                    <TableCell className="py-2.5">
                      <div>
                        <p className="text-[13px] font-medium text-fg">
                          {member.firstName} {member.lastName}
                        </p>
                        {member.phone && (
                          <p className="text-[11px] text-fg-subtle">{member.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-[12px] text-fg-muted">
                      {member.email}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant={ROLE_VARIANT[member.role] ?? "neutral"}>
                        {ROLE_LABELS[member.role] ?? member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5">
                      {member.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="neutral">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 text-[11px] text-fg-subtle num">
                      {member.lastLoginAt ? formatDate(member.lastLoginAt) : "Never"}
                    </TableCell>
                    <TableCell className="py-2.5 text-[11px] text-fg-subtle num">
                      {member.createdAt ? formatDate(member.createdAt) : "—"}
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditMember(member)}
                          className="inline-grid h-7 w-7 place-items-center rounded-md border border-border text-fg-muted hover:bg-surface-3 hover:text-fg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {member.isActive && (
                          <button
                            onClick={() => setDeactivateMember(member)}
                            className="inline-grid h-7 w-7 place-items-center rounded-md border border-border text-fg-muted hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-colors"
                            title="Deactivate"
                          >
                            <UserX className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
            <span className="text-[11px] text-fg-subtle num">
              Showing {(meta.page - 1) * 20 + 1}–{Math.min(meta.page * 20, meta.total)} of {meta.total}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                disabled={meta.page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Sheet */}
      <CreateStaffSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={invalidate}
      />

      {/* Edit Sheet */}
      <EditStaffSheet
        member={editMember}
        open={!!editMember}
        onOpenChange={(v) => { if (!v) setEditMember(null); }}
        onUpdated={invalidate}
      />

      {/* Deactivate Confirm */}
      <AlertDialog
        open={!!deactivateMember}
        onOpenChange={(v) => { if (!v) setDeactivateMember(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate staff member?</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivateMember && (
                <>
                  <strong>{deactivateMember.firstName} {deactivateMember.lastName}</strong> will
                  lose access immediately. Their account is preserved and can be reactivated at any
                  time.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={deactivating}
              className="bg-danger text-white hover:bg-danger/90"
            >
              {deactivating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Deactivate"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
