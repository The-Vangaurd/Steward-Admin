"use client";

import { useState, useEffect } from "react";
import { elapsedSeconds, formatElapsed, elapsedClass, elapsedLevel } from "@/utils/time";
import { cn } from "@/lib/utils";

interface ElapsedTimerProps {
  since: string;
  className?: string;
  /** Show animated tick indicator for urgency */
  showPulse?: boolean;
}

/**
 * Live elapsed timer — updates every second for real-time feel.
 * Visual urgency escalates with time:
 *   0-10min: muted gray
 *   10-20min: amber warning
 *   20min+:   red urgent + pulse animation
 */
export function ElapsedTimer({ since, className, showPulse = true }: ElapsedTimerProps) {
  const [seconds, setSeconds] = useState(() => elapsedSeconds(since));

  useEffect(() => {
    // Update every second for live feel
    const id = setInterval(() => {
      setSeconds(elapsedSeconds(since));
    }, 1_000);
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
      {/* Live indicator dot */}
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
}
