import { Badge } from "@/components/ui/badge";

type BadgeVariant = "default" | "neutral" | "warning" | "info" | "success" | "danger";

const STATUS_CONFIG: Record<string, { variant: BadgeVariant; label: string }> = {
  NEW:       { variant: "warning",  label: "New" },
  PENDING:   { variant: "warning",  label: "Pending" },
  CONFIRMED: { variant: "info",     label: "Confirmed" },
  PREPARING: { variant: "info",     label: "Preparing" },
  READY:     { variant: "success",  label: "Ready" },
  COMPLETED: { variant: "neutral",  label: "Completed" },
  CANCELLED: { variant: "danger",   label: "Cancelled" },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { variant: "neutral" as BadgeVariant, label: status };
  return (
    <Badge variant={cfg.variant}>
      <span className="h-1 w-1 rounded-full bg-current opacity-80" />
      {cfg.label}
    </Badge>
  );
}
