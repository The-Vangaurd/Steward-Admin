"use client";

import { RotateCcw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UndoSnapshot } from "@/hooks/useKitchenUndo";

interface UndoControlsProps {
    historyStack: UndoSnapshot[];
    canUndo: boolean;
    onUndo: () => void;
}

/**
 * UndoControls
 *
 * Displayed at the bottom of the kitchen page.
 * Shows the undo history stack (max 3) and lets staff restore
 * the previous queue state after a destructive action.
 */
export function UndoControls({ historyStack, canUndo, onUndo }: UndoControlsProps) {
    if (historyStack.length === 0) return null;

    return (
        <div className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Left: history list */}
                <div className="flex items-center gap-3 flex-wrap min-w-0">
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Clock className="h-3.5 w-3.5 text-white/30" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
                            Recent actions
                        </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {historyStack.map((snap, idx) => (
                            <HistoryPill key={snap.id} snapshot={snap} isLatest={idx === 0} />
                        ))}
                    </div>
                </div>

                {/* Right: undo button */}
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className={cn(
                        "flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold",
                        "border border-white/10 transition-all flex-shrink-0",
                        canUndo
                            ? "bg-white/8 hover:bg-white/14 text-white/80 hover:text-white hover:border-white/20"
                            : "opacity-30 cursor-not-allowed text-white/40"
                    )}
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Undo Last
                </button>
            </div>
        </div>
    );
}

function HistoryPill({
    snapshot,
    isLatest,
}: {
    snapshot: UndoSnapshot;
    isLatest: boolean;
}) {
    const time = new Date(snapshot.timestamp).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });

    return (
        <div
            className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]",
                "border transition-colors",
                isLatest
                    ? "border-[#C8B6E2]/25 bg-[#C8B6E2]/8 text-[#C8B6E2]/80"
                    : "border-white/[0.06] bg-white/[0.02] text-white/35"
            )}
        >
            <span className="font-medium truncate max-w-[120px]">{snapshot.label}</span>
            <span className="text-[10px] opacity-60">{time}</span>
        </div>
    );
}
