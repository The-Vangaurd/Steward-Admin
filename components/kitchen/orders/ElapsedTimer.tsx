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
 * Live elapsed timer — ticks every second for accurate MM:SS display.
 * Memoized so only re-renders when `since` changes (i.e. a new order arrives).
 */
export const ElapsedTimer = memo(function ElapsedTimer({ since, className, showPulse = true }: ElapsedTimerProps) {
  const [seconds, setSeconds] = useState(() => elapsedSeconds(since));

  useEffect(() => {
    const id = setInterval(() => setSeconds(elapsedSeconds(since)), 1_000);
    return () => clearInterval(id);
  }, [since]);

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
