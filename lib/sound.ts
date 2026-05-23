"use client";

import { Howl } from "howler";

let newOrderSound: Howl | null = null;
let orderReadySound: Howl | null = null;

/**
 * Lazily initialise sounds on first use.
 * Howler is browser-only so we guard against SSR.
 */
function getNewOrderSound(): Howl {
  if (!newOrderSound) {
    newOrderSound = new Howl({
      // A simple beep encoded as base64 WAV — no external asset needed.
      // This is a 440Hz tone, 0.5s duration, generated inline.
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

function getOrderReadySound(): Howl {
  if (!orderReadySound) {
    orderReadySound = new Howl({
      src: [
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA" +
          "EAAQARmQAAESsAAAIAIAABAAAAACAAAA" +
          "BAAEAAQAAwADAAIAAgABAAEAAAAAAAAA",
      ],
      volume: 0.6,
      html5: true,
    });
  }
  return orderReadySound;
}

/**
 * Play the new order notification sound.
 * Checks the global sound-enabled flag from localStorage.
 */
export function playNewOrderSound(): void {
  if (typeof window === "undefined") return;
  try {
    const enabled = localStorage.getItem("kitchen:sound") !== "false";
    if (!enabled) return;
    getNewOrderSound().play();
  } catch {
    // Audio blocked by browser policy — ignore
  }
}

export function playOrderReadySound(): void {
  if (typeof window === "undefined") return;
  try {
    const enabled = localStorage.getItem("kitchen:sound") !== "false";
    if (!enabled) return;
    getOrderReadySound().play();
  } catch {
    // ignore
  }
}
