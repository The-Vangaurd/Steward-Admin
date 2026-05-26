import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  loading?: boolean;
  trend?: { value: number; label?: string };
  accent?: "accent" | "info" | "success" | "danger" | "warning";
}

const accentMap = {
  accent:  "text-accent",
  info:    "text-info",
  success: "text-success",
  danger:  "text-danger",
  warning: "text-warning",
};

// Memoized — only re-renders when its own props change
export const KpiCard = memo(function KpiCard({ title, value, icon: Icon, description, loading, accent = "accent", trend }: KpiCardProps) {
  const color = accentMap[accent];
  return (
    <div className="group rounded-xl border border-border bg-surface p-4 transition-colors duration-150 hover:border-border-strong">
      <div className="flex items-center justify-between mb-3">
        <span className="label-xs">{title}</span>
        <Icon className={cn("h-3.5 w-3.5", color)} />
      </div>
      {loading ? (
        <Skeleton className="h-7 w-24" />
      ) : (
        <div className="text-[22px] font-semibold text-fg tracking-tight num leading-none">{value}</div>
      )}
      <div className="mt-2 flex items-center gap-2 min-h-[16px]">
        {trend && !loading && (
          <span className={cn(
            "inline-flex items-center gap-0.5 text-[11px] font-medium num",
            trend.value >= 0 ? "text-success" : "text-danger"
          )}>
            {trend.value >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </span>
        )}
        {description && !loading && (
          <span className="text-[11px] text-fg-subtle">{description}</span>
        )}
      </div>
    </div>
  );
});
