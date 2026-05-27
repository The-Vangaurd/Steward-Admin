"use client";

import { Howl } from "howler";

// SOUND_KEY must match the key used in stores/settings.store.ts
const SOUND_KEY = "steward-sound-enabled";

let newOrderSound: Howl | null = null;

/**
 * Lazily initialise the new-order sound on first use.
 * Howler is browser-only — this function must never be called on the server.
 */
function getNewOrderSound(): Howl {
  if (!newOrderSound) {
    newOrderSound = new Howl({
      // A simple beep encoded as base64 WAV — no external asset needed.
      src: [
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA" +
          "EAAQARmQAAESsAAAIAIAABAAAAACAAAA" +
          "QAD4A+AA+AP0A/QD8APwA+wD7APoA+gD5APkA+AD4APcA9wD2APYA9QD1APQA9ADzAPMA8gDy" +
          "APEA8QDwAPAA7wDvAO4A7gDtAO0A7ADsAOsA6wDqAOoA6QDpAOgA6ADnAOcA5gDmAOUA5QDk" +
          "AOQA4wDjAOIA4gDhAOEA4ADgAN8A3wDeAN4A3QDdANwA3ADbANsA2gDaANkA2QDYANQA",
      ],
      volume: 0.8,
      html5: true,
    });
  }
  return newOrderSound;
}

/**
 * Play the new order notification sound.
 * Reads the sound-enabled flag from localStorage using the same key as
 * settings.store.ts — toggling sound in the UI will correctly silence this.
 */
export function playNewOrderSound(): void {
  if (typeof window === "undefined") return;
  try {
    const enabled = localStorage.getItem(SOUND_KEY) !== "false";
    if (!enabled) return;
    getNewOrderSound().play();
  } catch {
    // Audio blocked by browser autoplay policy — ignore silently
  }
}
