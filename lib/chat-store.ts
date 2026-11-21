"use client";

import { useSyncExternalStore } from "react";
import type { Level } from "./ai/safety";

export type UiMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  level?: Level;
  errorCode?: string;
  reported?: boolean;
};

/**
 * Historique de la session en mémoire uniquement (aucune persistance) :
 * il survit à la navigation entre pages et disparaît au rechargement.
 */
let messages: UiMessage[] = [];
let noticeAccepted = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const chatStore = {
  get: () => messages,
  set(next: UiMessage[] | ((prev: UiMessage[]) => UiMessage[])) {
    messages = typeof next === "function" ? next(messages) : next;
    emit();
  },
  acceptNotice() {
    noticeAccepted = true;
    emit();
  },
};

const EMPTY: UiMessage[] = [];

export function useChatMessages() {
  return useSyncExternalStore(subscribe, () => messages, () => EMPTY);
}

export function useNoticeAccepted() {
  return useSyncExternalStore(subscribe, () => noticeAccepted, () => true);
}
