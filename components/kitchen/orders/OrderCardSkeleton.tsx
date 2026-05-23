/**
 * Shimmer skeleton that matches the OrderCard layout.
 * Uses CSS-only shimmer animation — no JS overhead.
 */
export function OrderCardSkeleton() {
  return (
    <div className="kds-card border-l-4 border-l-white/5 p-4 space-y-3 animate-kds-enter">
      {/* Header row */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="kds-skeleton h-7 w-32" />
          <div className="kds-skeleton h-3 w-20" />
        </div>
        <div className="space-y-2 flex flex-col items-end">
          <div className="kds-skeleton h-4 w-10" />
          <div className="kds-skeleton h-5 w-20 rounded-full" />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Item rows */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="kds-skeleton h-5 w-6 flex-shrink-0" />
          <div className="kds-skeleton h-4 flex-1" />
        </div>
        <div className="flex gap-2">
          <div className="kds-skeleton h-5 w-6 flex-shrink-0" />
          <div className="kds-skeleton h-4 w-4/5" />
        </div>
        <div className="flex gap-2">
          <div className="kds-skeleton h-5 w-6 flex-shrink-0" />
          <div className="kds-skeleton h-4 w-3/5" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between pt-1">
        <div className="kds-skeleton h-3 w-10" />
        <div className="kds-skeleton h-4 w-14" />
      </div>

      {/* Action button */}
      <div className="kds-skeleton h-[52px] w-full rounded-xl" />
    </div>
  );
}
