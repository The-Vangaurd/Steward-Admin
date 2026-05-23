import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  PENDING:    "bg-warning/10 text-warning border-warning/25",
  CONFIRMED:  "bg-info/10 text-info border-info/25",
  PREPARING:  "bg-info/10 text-info border-info/25",
  READY:      "bg-success/10 text-success border-success/25",
  COMPLETED:  "bg-success/10 text-success border-success/25",
  DELIVERED:  "bg-success/10 text-success border-success/25",
  CANCELLED:  "bg-danger/10 text-danger border-danger/25",
  REJECTED:   "bg-danger/10 text-danger border-danger/25",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-surface-3 text-fg-muted border-border";
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider num",
      cls
    )}>
      <span className="h-1 w-1 rounded-full bg-current opacity-80" />
      {status.toLowerCase()}
    </span>
  );
}
