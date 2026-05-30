"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { PackageSearch, RefreshCw, Download, MoreHorizontal, CreditCard, Utensils, Check, ClipboardCheck, XCircle } from "lucide-react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Order, OrderFilters as OrderFiltersType, ApiSuccess, PaginationMeta } from "@/types";

const ORDER_TYPE_LABELS: Record<string, string> = {
  DINE_IN: "Dine-in", TAKEAWAY: "Takeaway", DELIVERY: "Delivery",
};

function buildParams(filters: OrderFiltersType) {
  const p: Record<string, string | number> = { page: filters.page ?? 1, limit: filters.limit ?? 25 };
  if (filters.status) p.status = filters.status;
  if (filters.orderType) p.orderType = filters.orderType;
  if (filters.from) p.from = filters.from;
  if (filters.to) p.to = filters.to;
  return p;
}

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<OrderFiltersType>({ page: 1, limit: 25 });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["orders", filters],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Order[]> & { meta: PaginationMeta }>(
        "/orders/admin/list",
        { params: buildParams(filters) }
      );
      return data;
    },
  });

  const orders = data?.data ?? [];
  const meta = data?.meta;

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(`/orders/admin/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/orders/admin/${id}/pay`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 pb-1">
        <div>
          <div className="label-xs mb-1">Operations</div>
          <h2 className="text-xl font-semibold tracking-tight text-fg">Orders</h2>
          <p className="text-[12px] text-fg-subtle mt-1 num">
            {meta ? `${meta.total.toLocaleString()} total · Page ${meta.page} of ${meta.totalPages}` : "Loading…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm" variant="secondary" className="gap-1.5"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["orders"] })}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-surface p-3">
        <OrderFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {isLoading ? (
          <div className="space-y-1.5 p-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md bg-surface-2" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-fg-muted">Failed to load orders.</p>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 border border-border">
              <PackageSearch className="h-5 w-5 text-fg-subtle" />
            </div>
            <p className="text-[13px] font-medium text-fg">No orders found</p>
            <p className="text-[11px] text-fg-subtle">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-surface-2 hover:bg-surface-2">
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Order</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Status</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Type</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Table</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Payment</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Items</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle text-right">Total</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Placed</TableHead>
                  <TableHead className="h-9 w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: any) => (
                  <TableRow key={order.id} className="border-border hover:bg-surface-2 transition-colors">
                    <TableCell className="py-2.5 font-mono text-[12px] font-semibold text-fg num">
                      #{order.orderNumber}
                    </TableCell>
                    <TableCell className="py-2.5"><OrderStatusBadge status={order.status} /></TableCell>
                    <TableCell className="py-2.5">
                      <span className="text-[11px] text-fg-muted">
                        {ORDER_TYPE_LABELS[order.orderType] ?? order.orderType}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-[12px] text-fg-muted num">
                      {order.tableNumber ?? "—"}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        order.paymentStatus === "paid"
                          ? "bg-success/10 text-success border-success/30"
                          : order.paymentMethod === "online"
                          ? "bg-danger/10 text-danger border-danger/30 animate-pulse"
                          : "bg-warning/10 text-warning border-warning/30"
                      )}>
                        {order.paymentMethod === "online"
                          ? `Online · ${order.paymentStatus === "paid" ? "Paid" : "Failed"}`
                          : `Cash · Counter`}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-[12px] text-fg-muted num">
                      {order.items?.length ?? 0}
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-[12px] font-semibold text-fg num">
                      {formatCurrency(order.totalAmount ?? 0)}
                    </TableCell>
                    <TableCell className="py-2.5 text-[11px] text-fg-subtle num">
                      {order.createdAt ? formatDate(order.createdAt) : "—"}
                    </TableCell>
                    <TableCell className="py-2.5 pr-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-7 w-7 p-0 hover:bg-surface-3">
                            <MoreHorizontal className="h-4 w-4 text-fg-muted" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                          <DropdownMenuItem
                            disabled={order.paymentStatus === "paid" || markPaidMutation.isPending}
                            onClick={() => markPaidMutation.mutate(order.id)}
                            className={order.paymentStatus === "paid" ? "opacity-50" : ""}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            <span>Mark as Paid</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={order.status === "PREPARING" || order.status === "READY" || order.status === "COMPLETED" || order.status === "CANCELLED" || updateStatusMutation.isPending}
                            onClick={() => updateStatusMutation.mutate({ id: order.id, status: "PREPARING" })}
                          >
                            <Utensils className="mr-2 h-4 w-4" />
                            <span>Start Preparing</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={order.status === "READY" || order.status === "COMPLETED" || order.status === "CANCELLED" || updateStatusMutation.isPending}
                            onClick={() => updateStatusMutation.mutate({ id: order.id, status: "READY" })}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            <span>Mark Ready</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={order.status === "COMPLETED" || order.status === "CANCELLED" || updateStatusMutation.isPending}
                            onClick={() => updateStatusMutation.mutate({ id: order.id, status: "COMPLETED" })}
                          >
                            <ClipboardCheck className="mr-2 h-4 w-4" />
                            <span>Complete Order</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={order.status === "CANCELLED" || updateStatusMutation.isPending}
                            onClick={() => updateStatusMutation.mutate({ id: order.id, status: "CANCELLED" })}
                            className="text-danger focus:text-danger focus:bg-danger/10"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            <span>Cancel Order</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
            <span className="text-[11px] text-fg-subtle num">
              Showing {(meta.page - 1) * (filters.limit ?? 25) + 1}–{Math.min(meta.page * (filters.limit ?? 25), meta.total)} of {meta.total}
            </span>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="secondary" disabled={meta.page <= 1}
                onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) - 1 })}>Prev</Button>
              <Button size="sm" variant="secondary" disabled={meta.page >= meta.totalPages}
                onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) + 1 })}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
