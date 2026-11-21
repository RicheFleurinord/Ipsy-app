"use client";

import { STORAGE_KEYS, useLocal } from "./local-store";

export type Entry = { id: string; date: string; text: string; mood?: number; demo?: boolean };

export const MOOD_EMOJI: Record<number, string> = { 1: "😣", 2: "😟", 3: "😐", 4: "🙂", 5: "😊" };

const EMPTY: Entry[] = [];

export function useJournal() {
  return useLocal<Entry[]>(STORAGE_KEYS.journal, EMPTY);
}

export function useDemoMoods() {
  return useLocal<Entry[]>(STORAGE_KEYS.demoMoods, EMPTY);
}

export function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** Génère 30 jours d'humeurs fictives, clairement marquées comme démo. */
export function makeDemoMoods(): Entry[] {
  const out: Entry[] = [];
  const pattern = [2, 2, 3, 2, 3, 3, 4, 3, 2, 3, 4, 4, 3, 4, 3, 2, 3, 4, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 5, 4];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    out.push({ id: `demo-${iso}`, date: iso, text: "", mood: pattern[29 - i], demo: true });
  }
  return out;
}
