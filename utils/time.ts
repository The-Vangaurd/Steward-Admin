/**
 * Format elapsed seconds into a compact display string.
 * e.g. 65 → "1:05", 3600 → "60:00"
 */
export function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Compute elapsed seconds from a Date string to now.
 */
export function elapsedSeconds(since: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 1000));
}

/**
 * Return a CSS utility class based on elapsed time urgency.
 * >20min → urgent, >10min → warning, else normal
 */
export function elapsedClass(seconds: number): string {
  if (seconds >= 20 * 60) return "elapsed-urgent";
  if (seconds >= 10 * 60) return "elapsed-warning";
  return "elapsed-normal";
}

/**
 * Return elapsed urgency level for conditional rendering
 */
export function elapsedLevel(seconds: number): "urgent" | "warning" | "normal" {
  if (seconds >= 20 * 60) return "urgent";
  if (seconds >= 10 * 60) return "warning";
  return "normal";
}
