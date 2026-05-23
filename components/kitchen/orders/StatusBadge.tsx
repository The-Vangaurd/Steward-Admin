import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  PENDING:   { label: "Pending",   color: "text-[#D9B872]", bg: "bg-[#D9B872]/10", dot: "bg-[#D9B872]" },
  CONFIRMED: { label: "Confirmed", color: "text-[#9BAED2]", bg: "bg-[#9BAED2]/10", dot: "bg-[#9BAED2]" },
  PREPARING: { label: "Preparing", color: "text-[#C8B6E2]", bg: "bg-[#C8B6E2]/12", dot: "bg-[#C8B6E2]" },
  READY:     { label: "Ready",     color: "text-[#92B9A5]", bg: "bg-[#92B9A5]/10", dot: "bg-[#92B9A5]" },
  DELIVERED: { label: "Delivered", color: "text-white/40",   bg: "bg-white/5",       dot: "bg-white/30"   },
  CANCELLED: { label: "Cancelled", color: "text-[#D18B8B]", bg: "bg-[#D18B8B]/10", dot: "bg-[#D18B8B]" },
};

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, color, bg, dot } = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "text-xs font-semibold tracking-wide uppercase",
        bg, color, className
      )}
    >
      <span className={cn("block h-1.5 w-1.5 rounded-full flex-shrink-0", dot)} />
      {label}
    </span>
  );
}
