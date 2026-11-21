"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const noop = () => () => {};

export function useIsClient() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/** Rend les enfants uniquement dans le navigateur (dates locales, localStorage). */
export default function ClientOnly({ children }: { children: ReactNode }) {
  const isClient = useIsClient();
  if (!isClient) return <div className="mx-auto min-h-[60vh] max-w-3xl px-5 py-12" aria-busy="true" />;
  return <>{children}</>;
}
