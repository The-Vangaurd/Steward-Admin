"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Power, Clock, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { ApiSuccess } from "@/types";

type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface Shift {
    id: string;
    name: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    isEnabled: boolean;
}

interface ShiftsResponse {
    grouped: Record<string, Shift[]>;
    flat: Shift[];
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function useShifts() {
    return useQuery({
        queryKey: ["shifts"],
        queryFn: async () => {
            const { data } = await api.get<ApiSuccess<ShiftsResponse>>("/shifts");
            return data.data;
        },
    });
}

interface ShiftRowProps {
    shift: Shift;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, changes: Partial<Shift>) => void;
}

function ShiftRow({ shift, onToggle, onDelete, onUpdate }: ShiftRowProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState({ name: shift.name, startTime: shift.startTime, endTime: shift.endTime });

    const handleSave = () => {
        if (!draft.name.trim()) return;
        onUpdate(shift.id, draft);
        setEditing(false);
    };

    const handleCancel = () => {
        setDraft({ name: shift.name, startTime: shift.startTime, endTime: shift.endTime });
        setEditing(false);
    };

    return (
        <div className={cn(
            "flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
            shift.isEnabled ? "border-border bg-surface" : "border-border/50 bg-surface/50 opacity-60"
        )}>
            {editing ? (
                <>
                    <Input
                        className="flex-1 h-8 text-[12px]"
                        value={draft.name}
                        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                        placeholder="Shift name"
                    />
                    <div className="flex items-center gap-2">
                        <input
                            type="time"
                            value={draft.startTime}
                            onChange={(e) => setDraft((d) => ({ ...d, startTime: e.target.value }))}
                            className="h-8 rounded-md border border-border bg-surface-2 px-2 text-[12px] text-fg focus:border-accent focus:outline-none"
                        />
                        <span className="text-[11px] text-fg-subtle">to</span>
                        <input
                            type="time"
                            value={draft.endTime}
                            onChange={(e) => setDraft((d) => ({ ...d, endTime: e.target.value }))}
                            className="h-8 rounded-md border border-border bg-surface-2 px-2 text-[12px] text-fg focus:border-accent focus:outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={handleSave}
                            className="grid h-7 w-7 place-items-center rounded-md bg-success/15 text-success hover:bg-success/25 transition-colors"
                            aria-label="Save"
                        >
                            <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={handleCancel}
                            className="grid h-7 w-7 place-items-center rounded-md bg-surface-2 text-fg-subtle hover:text-fg hover:bg-surface-3 transition-colors"
                            aria-label="Cancel"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-fg truncate">{shift.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock className="h-3 w-3 text-fg-subtle" />
                            <span className="text-[11px] text-fg-subtle">{shift.startTime} – {shift.endTime}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Switch
                            checked={shift.isEnabled}
                            onCheckedChange={() => onToggle(shift.id)}
                            aria-label={`${shift.isEnabled ? "Disable" : "Enable"} shift`}
                        />
                        <button
                            onClick={() => setEditing(true)}
                            className="grid h-7 w-7 place-items-center rounded-md text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors"
                            aria-label="Edit shift"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={() => onDelete(shift.id)}
                            className="grid h-7 w-7 place-items-center rounded-md text-fg-subtle hover:text-danger hover:bg-danger/10 transition-colors"
                            aria-label="Delete shift"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

interface AddShiftFormProps {
    dayOfWeek: DayOfWeek;
    onAdd: (data: { name: string; dayOfWeek: DayOfWeek; startTime: string; endTime: string }) => void;
    onCancel: () => void;
}

function AddShiftForm({ dayOfWeek, onAdd, onCancel }: AddShiftFormProps) {
    const [name, setName] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("17:00");

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
            <Input
                className="flex-1 h-8 text-[12px]"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lunch Service, Dinner Rush"
                autoFocus
            />
            <div className="flex items-center gap-2">
                <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-8 rounded-md border border-border bg-surface-2 px-2 text-[12px] text-fg focus:border-accent focus:outline-none"
                />
                <span className="text-[11px] text-fg-subtle">to</span>
                <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-8 rounded-md border border-border bg-surface-2 px-2 text-[12px] text-fg focus:border-accent focus:outline-none"
                />
            </div>
            <div className="flex items-center gap-1.5">
                <button
                    onClick={() => { if (name.trim()) onAdd({ name: name.trim(), dayOfWeek, startTime, endTime }); }}
                    disabled={!name.trim()}
                    className="grid h-7 w-7 place-items-center rounded-md bg-accent/15 text-accent hover:bg-accent/25 transition-colors disabled:opacity-40"
                    aria-label="Add shift"
                >
                    <Check className="h-3.5 w-3.5" />
                </button>
                <button
                    onClick={onCancel}
                    className="grid h-7 w-7 place-items-center rounded-md bg-surface-2 text-fg-subtle hover:text-fg transition-colors"
                    aria-label="Cancel"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}

export function TabShifts() {
    const queryClient = useQueryClient();
    const { data, isLoading } = useShifts();
    const [addingForDay, setAddingForDay] = useState<DayOfWeek | null>(null);

    const createMutation = useMutation({
        mutationFn: (body: object) => api.post("/shifts", body),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["shifts"] }); toast.success("Shift added"); },
        onError: () => toast.error("Failed to add shift"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: object }) => api.patch(`/shifts/${id}`, body),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["shifts"] }); toast.success("Shift updated"); },
        onError: () => toast.error("Failed to update shift"),
    });

    const toggleMutation = useMutation({
        mutationFn: (id: string) => api.post(`/shifts/${id}/toggle`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shifts"] }),
        onError: () => toast.error("Failed to toggle shift"),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/shifts/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["shifts"] }); toast.success("Shift deleted"); },
        onError: () => toast.error("Failed to delete shift"),
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[13px] font-semibold text-fg mb-1">Weekly Shifts</h2>
                <p className="text-[12px] text-fg-subtle">
                    Define the operating shifts for each day of the week. Kitchen staff will see shift labels on the board.
                </p>
            </div>

            {Array.from({ length: 7 }, (_, i) => i as DayOfWeek).map((day) => {
                const shifts = data?.grouped[day] ?? [];
                return (
                    <div key={day}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[13px] font-semibold text-fg">{DAY_NAMES[day]}</span>
                                {shifts.length > 0 && (
                                    <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-surface-2 border border-border text-[9px] font-medium text-fg-muted px-1">
                                        {shifts.length}
                                    </span>
                                )}
                            </div>
                            {addingForDay !== day && (
                                <button
                                    onClick={() => setAddingForDay(day)}
                                    className="flex items-center gap-1 text-[11px] font-medium text-fg-subtle hover:text-fg transition-colors"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add shift
                                </button>
                            )}
                        </div>

                        <div className="space-y-2">
                            {shifts.map((shift) => (
                                <ShiftRow
                                    key={shift.id}
                                    shift={shift}
                                    onToggle={(id) => toggleMutation.mutate(id)}
                                    onDelete={(id) => deleteMutation.mutate(id)}
                                    onUpdate={(id, changes) => updateMutation.mutate({ id, body: changes })}
                                />
                            ))}

                            {addingForDay === day && (
                                <AddShiftForm
                                    dayOfWeek={day}
                                    onAdd={(d) => {
                                        createMutation.mutate(d);
                                        setAddingForDay(null);
                                    }}
                                    onCancel={() => setAddingForDay(null)}
                                />
                            )}

                            {shifts.length === 0 && addingForDay !== day && (
                                <p className="text-[11px] text-fg-subtle italic px-1">No shifts defined</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}