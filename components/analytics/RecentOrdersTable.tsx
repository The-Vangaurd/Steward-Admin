"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import type { Order, ApiSuccess } from "@/types";

interface Props {
  params: { from: string; to: string };
  activeRange: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  NEW:       { label: "New Order",  className: "bg-warning/10 text-warning border-warning/20" },
  PREPARING: { label: "Preparing",  className: "bg-info/10 text-info border-info/20" },
  READY:     { label: "Ready",      className: "bg-success/10 text-success border-success/20" },
  COMPLETED: { label: "Completed",  className: "bg-surface-2 text-fg-subtle border-border" },
  CANCELLED: { label: "Cancelled",  className: "bg-danger/10 text-danger border-danger/20" },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: "bg-surface-2 text-fg-subtle border-border" };
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap",
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
          <td className="px-3 py-3"><Skeleton className="h-3 w-4 bg-surface-3" /></td>
          <td className="px-3 py-3"><Skeleton className="h-3 w-16 bg-surface-3" /></td>
          <td className="px-3 py-3"><Skeleton className="h-3 w-24 bg-surface-3" /></td>
          <td className="px-3 py-3"><Skeleton className="h-3 w-20 bg-surface-3" /></td>
          <td className="px-3 py-3"><Skeleton className="h-3 w-16 bg-surface-3" /></td>
          <td className="px-3 py-3"><Skeleton className="h-3 w-14 bg-surface-3" /></td>
          <td className="px-3 py-3"><Skeleton className="h-5 w-16 rounded-full bg-surface-3" /></td>
          <td className="px-3 py-3"><Skeleton className="h-6 w-6 rounded-md bg-surface-3" /></td>
        </tr>
      ))}
    </>
  );
}

export function RecentOrdersTable({ params }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["recent-orders-table", params],
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-border">
              {["No", "ID", "Date", "Customer Name", "Location", "Amount", "Status", "Action"].map((col) => (
                <th key={col} className="label-xs px-3 pb-2.5 text-left font-semibold uppercase tracking-wider">
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
              orders.map((order, idx) => (
                <tr key={order.id} className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors">
                  <td className="px-3 py-2.5 text-[12px] text-fg-subtle tabular-nums">{idx + 1}</td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-[12px] text-fg">#{order.orderNumber}</span>
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-fg-muted whitespace-nowrap">
                    {order.createdAt ? format(new Date(order.createdAt), "MMM do, yyyy") : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-fg">
                    {order.customerName ?? "Guest"}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-fg-muted whitespace-nowrap">
                    {order.tableNumber ? `Table ${order.tableNumber}` : order.orderType ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-fg tabular-nums">
                    {formatCurrency(order.totalAmount ?? 0)}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href="/orders">
                      <button
                        type="button"
                        className="grid h-6 w-6 place-items-center rounded-md text-fg-subtle hover:bg-surface-3 hover:text-fg transition-colors"
                        title="View orders"
                        aria-label="View orders"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
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
