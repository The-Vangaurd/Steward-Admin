"use client";

import { useSyncExternalStore } from "react";

interface SettingsState {
  soundEnabled: boolean;
  wsConnected: boolean;
}

const SOUND_KEY = "steward-sound-enabled";

// ── SSR-safe initialisation ───────────────────────────────────────────────────
// Do NOT read localStorage at module evaluation time:
//   1. The module-level `let state` is a singleton shared across SSR requests,
//      so one user's preference could bleed into another user's server render.
//   2. `localStorage` is not available in the Node.js SSR environment even
//      with a `typeof window` guard when the module is evaluated server-side.
//
// Instead, we initialise with a safe server-side default and hydrate from
// localStorage lazily inside `getSnapshot` (client-only) and `getServerSnapshot`
// (server — always returns the default, preventing hydration mismatches).

function readSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(SOUND_KEY) !== "false";
  } catch {
    return true;
  }
}

// State is populated on first client-side read via getSnapshot.
let state: SettingsState = {
  soundEnabled: true, // safe default; overwritten on first client render
  wsConnected: false,
};

// Track whether we have hydrated from localStorage yet.
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
  // Server snapshot always returns the safe default to avoid hydration
  // mismatches (server can't read localStorage).
  getServerSnapshot(): SettingsState {
    return { soundEnabled: true, wsConnected: false };
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
  setWsConnected(wsConnected: boolean) {
    const current = getHydratedState();
    if (current.wsConnected === wsConnected) return; // no-op if unchanged
    state = { ...current, wsConnected };
    emit();
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
  };
}
