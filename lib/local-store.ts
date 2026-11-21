"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Petit store basé sur localStorage, compatible SSR, partagé entre composants.
 * Réservé aux données de démonstration non sensibles (langue, thème, journal fictif).
 */
const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = () => cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = safeGet(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T = fallback;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

export function writeLocal<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage indisponible : on ignore */
  }
  emit();
}

export function removeLocal(keys: string[]) {
  try {
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  emit();
}

export function useLocal<T>(key: string, fallback: T): [T, (v: T) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => readLocal(key, fallback),
    () => fallback,
  );
  const set = useCallback((v: T) => writeLocal(key, v), [key]);
  return [value, set];
}

export const STORAGE_KEYS = {
  lang: "ipsy.lang",
  theme: "ipsy.theme",
  journal: "ipsy.journal",
  demoMoods: "ipsy.demoMoods",
  reports: "ipsy.reports",
} as const;
