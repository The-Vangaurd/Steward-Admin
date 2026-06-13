"use client";

import { useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { BanknoteIcon, RefreshCw, CheckCircle2, Clock, ShoppingBag, Utensils, Package, X } from "lucide-react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import type { ApiSuccess } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  name: string;
  quantity: number;
  price: string | number;
}

interface PayAtCounterOrder {
  id: string;
  orderNumber: string;
  status: string;
  orderType: string;
  tableNumber?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  subtotal: string | number;
  taxAmount: string | number;
  serviceChargeAmount: string | number;
  totalAmount: string | number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  NEW:       "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PREPARING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  READY:     "bg-success/10 text-success border-success/20",
  DELIVERED: "bg-fg-subtle/10 text-fg-subtle border-fg-subtle/20",
  CANCELLED: "bg-danger/10 text-danger border-danger/20",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "New", PREPARING: "Preparing", READY: "Ready", DELIVERED: "Delivered", CANCELLED: "Cancelled",
};

const ORDER_TYPE_ICON: Record<string, React.ElementType> = {
  DINE_IN: Utensils, TAKEAWAY: Package, DELIVERY: ShoppingBag,
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border",
      STATUS_STYLES[status] ?? "bg-fg-subtle/10 text-fg-subtle border-fg-subtle/20"
    )}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  onPay,
  onDelete,
  isPaying,
}: {
  order: PayAtCounterOrder;
  onPay: () => void;
  onDelete: () => void;
  isPaying: boolean;
}) {
  const TypeIcon = ORDER_TYPE_ICON[order.orderType] ?? ShoppingBag;
  const time = new Date(order.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="rounded-xl border border-border bg-surface flex flex-col overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-surface-2">
        <div className="flex items-center gap-2 min-w-0">
          <TypeIcon className="h-3.5 w-3.5 text-fg-subtle shrink-0" />
          <span className="text-[13px] font-semibold text-fg truncate">
            #{order.orderNumber}
          </span>
          {order.tableNumber && (
            <span className="text-[11px] text-fg-subtle">· Table {order.tableNumber}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={order.status} />
          <span className="text-[11px] text-fg-subtle num">{time}</span>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 flex-1 space-y-1.5">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <span className="text-[13px] text-fg truncate">
              <span className="text-fg-subtle mr-1">{item.quantity}×</span>
              {item.name}
            </span>
            <span className="text-[12px] text-fg-subtle num shrink-0">
              {formatCurrency(Number(item.price) * item.quantity)}
            </span>
          </div>
        ))}

        {order.customerName && (
          <p className="text-[11px] text-fg-subtle pt-1 border-t border-border mt-2">
            {order.customerName}
            {order.customerPhone && ` · ${order.customerPhone}`}
          </p>
        )}
      </div>

      {/* Footer: total + pay button */}
      <div className="px-4 py-3 border-t border-border bg-surface-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] text-fg-subtle uppercase tracking-wide">Total</div>
          <div className="text-[15px] font-semibold text-fg num">
            {formatCurrency(Number(order.totalAmount))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {order.status === "CANCELLED" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onDelete}
              className="gap-1.5 bg-danger hover:bg-danger/90 text-white border-0"
            >
              <X className="h-3.5 w-3.5" />
              Delete
            </Button>
          )}
          <Button
            size="sm"
            onClick={onPay}
            disabled={isPaying || order.status === "CANCELLED"}
            className={cn(
              "gap-1.5 border-0",
              order.status === "CANCELLED"
                ? "bg-white/10 text-white/40 cursor-not-allowed hover:bg-white/10"
                : "bg-success hover:bg-success/90 text-white"
            )}
          >
            {isPaying && order.status !== "CANCELLED" ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            {isPaying && order.status !== "CANCELLED" ? "Processing…" : "Mark as Paid"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-surface-2 flex justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="px-4 py-3 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
      </div>
      <div className="px-4 py-3 border-t border-border bg-surface-2 flex justify-between items-center">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2.5">
      <Icon className="h-4 w-4 text-accent shrink-0" />
      <div>
        <div className="text-[10px] text-fg-subtle uppercase tracking-wide leading-none mb-0.5">{label}</div>
        <div className="text-[13px] font-semibold text-fg num leading-none">{value}</div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PayAtCounterPage() {
  const queryClient = useQueryClient();
  const [hiddenOrders, setHiddenOrders] = useState<Set<string>>(new Set());

  const { data, isLoading, isError } = useQuery({
    queryKey: ["pay-at-counter"],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<PayAtCounterOrder[]>>(
        "/orders/admin/list",
        { params: { paymentMethod: "cash", paymentStatus: "pending", limit: 100 } }
      );
      return data;
    },
    // Refresh every 30 s so new orders appear without a manual refresh
    refetchInterval: 30_000,
  });

  const orders: PayAtCounterOrder[] = (data?.data ?? []).filter((o: PayAtCounterOrder) => !hiddenOrders.has(o.id));
  const totalDue = orders.reduce((sum: number, o: PayAtCounterOrder) => sum + Number(o.totalAmount), 0);

  const markPaidMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post(`/orders/admin/${orderId}/pay`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pay-at-counter"] });
    },
  });

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-5 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 pb-1">
        <div>
          <div className="label-xs mb-1">Operations</div>
          <h2 className="text-xl font-semibold tracking-tight text-fg">Pay at Counter</h2>
          <p className="text-[12px] text-fg-subtle mt-1">
            Cash orders waiting to be collected · auto-refreshes every 30 s
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["pay-at-counter"] })}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="flex flex-wrap gap-2">
          <StatPill
            icon={ShoppingBag}
            label="Pending orders"
            value={orders.length}
          />
          <StatPill
            icon={BanknoteIcon}
            label="Total due"
            value={formatCurrency(totalDue)}
          />
          {orders.length > 0 && (
            <StatPill
              icon={Clock}
              label="Oldest order"
              value={new Date(orders[orders.length - 1].createdAt).toLocaleTimeString("en-IN", {
                hour: "2-digit", minute: "2-digit",
              })}
            />
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center">
          <p className="text-[13px] text-danger">Failed to load orders. Please refresh.</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 border border-success/20 mb-3">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
          <h3 className="text-[14px] font-semibold text-fg mb-1">All clear</h3>
          <p className="text-[12px] text-fg-subtle max-w-xs">
            No cash orders are waiting at the counter. New orders will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order: PayAtCounterOrder) => (
            <OrderCard
              key={order.id}
              order={order}
              onPay={() => markPaidMutation.mutate(order.id)}
              onDelete={() => setHiddenOrders((prev: Set<string>) => new Set(prev).add(order.id))}
              isPaying={markPaidMutation.isPending && markPaidMutation.variables === order.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
