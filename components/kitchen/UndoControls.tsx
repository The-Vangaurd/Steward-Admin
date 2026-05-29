"use client";

import { RotateCcw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback } from "react";
import type { UndoSnapshot } from "@/hooks/useKitchenUndo";

const UNDO_WINDOW_SECONDS = 30; // How long the undo window stays open

interface UndoControlsProps {
    historyStack: UndoSnapshot[];
    canUndo: boolean;
    onUndo: () => void;
    /** Called after the undo API call succeeds — for optimistic UI cleanup */
    onApiUndo?: (snapshot: UndoSnapshot) => void;
}

export function UndoControls({ historyStack, canUndo, onUndo, onApiUndo }: UndoControlsProps) {
    const [secondsLeft, setSecondsLeft] = useState(UNDO_WINDOW_SECONDS);
    const latestSnapshot = historyStack[0];

    // Reset + start countdown whenever a new action is pushed
    useEffect(() => {
        if (!latestSnapshot) return;
        setSecondsLeft(UNDO_WINDOW_SECONDS);

        const interval = setInterval(() => {
            setSecondsLeft((s) => {
                if (s <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return s - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [latestSnapshot?.id]);

    const handleUndo = useCallback(() => {
        if (!canUndo || secondsLeft === 0) return;
        onUndo();
        if (latestSnapshot && onApiUndo) {
            onApiUndo(latestSnapshot);
        }
    }, [canUndo, secondsLeft, onUndo, onApiUndo, latestSnapshot]);

    if (historyStack.length === 0) return null;

    const isExpired = secondsLeft === 0;
    const urgency = secondsLeft <= 10 ? "urgent" : secondsLeft <= 20 ? "warning" : "normal";

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

                {/* Right: undo button with countdown */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Countdown ring */}
                    {!isExpired && canUndo && (
                        <div className="relative flex items-center justify-center w-8 h-8">
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 32 32">
                                <circle
                                    cx="16" cy="16" r="13"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    className="text-white/10"
                                />
                                <circle
                                    cx="16" cy="16" r="13"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeDasharray={`${2 * Math.PI * 13}`}
                                    strokeDashoffset={`${2 * Math.PI * 13 * (1 - secondsLeft / UNDO_WINDOW_SECONDS)}`}
                                    strokeLinecap="round"
                                    className={cn(
                                        "transition-all duration-1000",
                                        urgency === "urgent" ? "text-red-400" :
                                            urgency === "warning" ? "text-amber-400" :
                                                "text-[#C8B6E2]"
                                    )}
                                />
                            </svg>
                            <span className={cn(
                                "text-[9px] font-bold tabular-nums",
                                urgency === "urgent" ? "text-red-400" :
                                    urgency === "warning" ? "text-amber-400" :
                                        "text-white/60"
                            )}>
                                {secondsLeft}
                            </span>
                        </div>
                    )}

                    <button
                        onClick={handleUndo}
                        disabled={!canUndo || isExpired}
                        aria-label={isExpired ? "Undo window expired" : `Undo last action (${secondsLeft}s)`}
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold",
                            "border border-white/10 transition-all",
                            canUndo && !isExpired
                                ? "bg-white/8 hover:bg-white/14 text-white/80 hover:text-white hover:border-white/20"
                                : "opacity-30 cursor-not-allowed text-white/40"
                        )}
                    >
                        <RotateCcw className={cn("h-3.5 w-3.5", canUndo && !isExpired && "hover:animate-spin")} />
                        {isExpired ? "Expired" : "Undo Last"}
                    </button>
                </div>
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