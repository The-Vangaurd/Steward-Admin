"use client";

import { useSyncExternalStore } from "react";

interface SettingsState {
  soundEnabled: boolean;
  wsConnected: boolean;
  /** Number of active socket hook instances. Prevents false disconnects. */
  activeSocketCount: number;
}

const SOUND_KEY = "steward-sound-enabled";

function readSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(SOUND_KEY) !== "false";
  } catch {
    return true;
  }
}

let state: SettingsState = {
  soundEnabled: true,
  wsConnected: false,
  activeSocketCount: 0,
};

let hydrated = false;

function getHydratedState(): SettingsState {
  if (!hydrated && typeof window !== "undefined") {
    hydrated = true;
    state = { ...state, soundEnabled: readSoundEnabled() };
  }
  return state;
}

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export const settingsStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getSnapshot(): SettingsState {
    return getHydratedState();
  },

  getServerSnapshot(): SettingsState {
    return { soundEnabled: true, wsConnected: false, activeSocketCount: 0 };
  },

  toggleSound() {
    const current = getHydratedState();
    state = { ...current, soundEnabled: !current.soundEnabled };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(SOUND_KEY, String(state.soundEnabled));
      } catch {
        // Storage quota exceeded — not fatal.
      }
    }
    emit();
  },

  /**
   * setWsConnected: only marks disconnected when there are NO active socket hooks.
   * This prevents false disconnects when one hook unmounts while another is still active
   * (e.g. navigating between kitchen and settings pages).
   */
  setWsConnected(wsConnected: boolean) {
    const current = getHydratedState();
    // When disconnecting, only actually disconnect if no sockets are active
    if (!wsConnected && current.activeSocketCount > 1) return;
    if (current.wsConnected === wsConnected) return;
    state = { ...current, wsConnected };
    emit();
  },

  /**
   * Call when a socket hook mounts and acquires a connection.
   * Returns the new count.
   */
  incrementSocketCount(): number {
    const current = getHydratedState();
    state = { ...current, activeSocketCount: current.activeSocketCount + 1 };
    emit();
    return state.activeSocketCount;
  },

  /**
   * Call when a socket hook unmounts and releases its connection.
   * Returns the new count.
   */
  decrementSocketCount(): number {
    const current = getHydratedState();
    const newCount = Math.max(0, current.activeSocketCount - 1);
    state = { ...current, activeSocketCount: newCount };
    // If count reaches 0 and we were connected, mark disconnected
    if (newCount === 0 && current.wsConnected) {
      state = { ...state, wsConnected: false };
    }
    emit();
    return state.activeSocketCount;
  },
};

export function useSettingsStore() {
  const snapshot = useSyncExternalStore(
    settingsStore.subscribe,
    settingsStore.getSnapshot,
    settingsStore.getServerSnapshot,
  );

  return {
    ...snapshot,
    toggleSound: settingsStore.toggleSound,
    setWsConnected: settingsStore.setWsConnected,
    incrementSocketCount: settingsStore.incrementSocketCount,
    decrementSocketCount: settingsStore.decrementSocketCount,
  };
}