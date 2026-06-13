"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import type { Order, ApiSuccess } from "@/types";

interface RecentOrdersTableProps {
  params: { from: string; to: string };
  activeRange: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  NEW:       { label: "New Order",  className: "bg-warning/10 text-warning border-warning/30" },
  PREPARING: { label: "Preparing",  className: "bg-info/10 text-info border-info/30" },
  READY:     { label: "Ready",      className: "bg-success/10 text-success border-success/30" },
  COMPLETED: { label: "Completed",  className: "bg-surface-2 text-fg-subtle border-border" },
  CANCELLED: { label: "Cancelled",  className: "bg-danger/10 text-danger border-danger/30" },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: "bg-surface-2 text-fg-subtle border-border" };
  return (
    <span className={cn(
      "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
      config.className
    )}>
      {config.label}
    </span>
  );
}

function TableSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <tr key={i} className="border-b border-border last:border-0">
          <td className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
          <td className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
          <td className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
          <td className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
          <td className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
          <td className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
          <td className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
          <td className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
        </tr>
      ))}
    </>
  );
}

function CardSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-surface-2 p-3.5 space-y-2.5 animate-pulse">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecentOrdersTable({ params, activeRange }: RecentOrdersTableProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["recent-orders-table", params, activeRange],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Order[]>>("/orders/admin/list", {
        params: { from: params.from, to: params.to, limit: 15, page: 1 },
      });
      return data.data ?? [];
    },
    staleTime: 60_000,
  });

  const orders = data ?? [];

  return (
    <div className="rounded-xl border border-border bg-surface p-4">

      {/* ── Mobile card list (hidden on md+) ──────────────────────────────── */}
      <div className="md:hidden">
        {isLoading ? (
          <CardSkeleton />
        ) : orders.length === 0 ? (
          <p className="py-10 text-center text-[12px] text-fg-subtle">No orders in this period</p>
        ) : (
          <div className="space-y-2.5">
            {orders.map((order: Order, idx: number) => (
              <Link key={order.id} href="/orders">
                <div className="rounded-xl border border-border bg-surface-2 hover:bg-surface-3 transition-colors p-3.5">
                  {/* Row 1 — order number + status */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[13px] font-semibold text-fg">
                      #{order.orderNumber}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  {/* Row 2 — customer + amount */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] text-fg-muted tabular-nums shrink-0">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[12px] text-fg truncate">
                        {order.customerName ?? "Guest"}
                      </span>
                      {order.tableNumber && (
                        <span className="text-[11px] text-fg-subtle shrink-0">
                          · Table {order.tableNumber}
                        </span>
                      )}
                    </div>
                    <span className="text-[13px] font-semibold text-fg tabular-nums ml-2 shrink-0">
                      {formatCurrency(order.totalAmount ?? 0)}
                    </span>
                  </div>
                  {/* Row 3 — date */}
                  <div className="mt-1 text-[11px] text-fg-subtle">
                    {format(new Date(order.createdAt), "MMM do, yyyy")}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop table (hidden on <md) ─────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-border">
              {["No", "ID", "Date", "Customer Name", "Location", "Amount", "Status", "Action"].map((col) => (
                <th key={col} className="label-xs uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeleton />
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-[12px] text-fg-subtle">
                  No orders in this period
                </td>
              </tr>
            ) : (
              orders.map((order: Order, idx: number) => (
                <tr key={order.id} className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors">
                  <td className="px-3 py-2.5 text-[12px] text-fg-subtle tabular-nums">{idx + 1}</td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-[12px] text-fg">#{order.orderNumber}</span>
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-fg-muted whitespace-nowrap">
                    {format(new Date(order.createdAt), "MMM do, yyyy")}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-fg">
                    {order.customerName ?? "Guest"}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-fg-muted whitespace-nowrap">
                    {order.tableNumber ? `Table ${order.tableNumber}` : (order.orderType ?? "—")}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-fg tabular-nums">
                    {formatCurrency(order.totalAmount ?? 0)}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href="/orders">
                      <button className="grid h-6 w-6 place-items-center rounded-md hover:bg-surface-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

