"use client";

import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-3.5 w-3.5 border",
  md: "h-5 w-5 border-2",
  lg: "h-8 w-8 border-2",
};

export function Spinner({ className, size = "md" }: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-fg-subtle border-t-fg",
        sizeMap[size],
        className
      )}
    />
  );
}
