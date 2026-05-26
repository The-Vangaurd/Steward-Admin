"use client";

import { useSyncExternalStore } from "react";

interface SettingsState {
  soundEnabled: boolean;
  wsConnected: boolean;
}

const SOUND_KEY = "steward-sound-enabled";

let state: SettingsState = {
  soundEnabled: typeof window !== "undefined"
    ? localStorage.getItem(SOUND_KEY) !== "false"
    : true,
  wsConnected: false,
};

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
    return state;
  },
  toggleSound() {
    state = { ...state, soundEnabled: !state.soundEnabled };
    if (typeof window !== "undefined") {
      localStorage.setItem(SOUND_KEY, String(state.soundEnabled));
    }
    emit();
  },
  setWsConnected(wsConnected: boolean) {
    if (state.wsConnected === wsConnected) return; // no-op if unchanged
    state = { ...state, wsConnected };
    emit();
  },
};

export function useSettingsStore() {
  const snapshot = useSyncExternalStore(
    settingsStore.subscribe,
    settingsStore.getSnapshot,
    settingsStore.getSnapshot
  );

  return {
    ...snapshot,
    toggleSound: settingsStore.toggleSound,
    setWsConnected: settingsStore.setWsConnected,
  };
}
