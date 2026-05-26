"use client";

import { useState, useEffect, memo } from "react";
import { elapsedSeconds, formatElapsed, elapsedClass, elapsedLevel } from "@/utils/time";
import { cn } from "@/lib/utils";

interface ElapsedTimerProps {
  since: string;
  className?: string;
  showPulse?: boolean;
}

/**
 * Live elapsed timer — updates every 10s for normal orders, every 1s for urgent.
 * Reduced interval prevents excessive rerenders across all order cards.
 */
export const ElapsedTimer = memo(function ElapsedTimer({ since, className, showPulse = true }: ElapsedTimerProps) {
  const [seconds, setSeconds] = useState(() => elapsedSeconds(since));

  useEffect(() => {
    // Update every 10s for normal orders (saves ~9x interval callbacks)
    // When urgent (>20min), switch to every 5s for live feel
    const tick = () => setSeconds(elapsedSeconds(since));
    const getInterval = (secs: number) => (elapsedLevel(secs) === "urgent" ? 5_000 : 10_000);

    let id = setInterval(tick, getInterval(seconds));
    const reschedule = () => {
      clearInterval(id);
      const next = elapsedSeconds(since);
      id = setInterval(tick, getInterval(next));
    };

    // Reschedule when urgency level might change (at ~10min and ~20min)
    const urgencyCheckId = setInterval(reschedule, 60_000);

    return () => {
      clearInterval(id);
      clearInterval(urgencyCheckId);
    };
  }, [since]); // only re-register if `since` changes

  const level = elapsedLevel(seconds);
  const isUrgent = level === "urgent";
  const isWarning = level === "warning";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-sm font-semibold tracking-tight",
        elapsedClass(seconds),
        isUrgent && showPulse && "animate-kds-tick",
        className
      )}
      title={`Order placed ${formatElapsed(seconds)} ago`}
    >
      {showPulse && (
        <span
          className={cn(
            "block h-1.5 w-1.5 rounded-full flex-shrink-0",
            isUrgent  && "bg-[#D18B8B] animate-kds-dot-pulse",
            isWarning && "bg-[#D9B872] animate-kds-dot-pulse",
            !isUrgent && !isWarning && "bg-white/30"
          )}
        />
      )}
      <span>{formatElapsed(seconds)}</span>
    </div>
  );
});
