"use client";

import { dictionaries, type Lang } from "./dictionary";
import { STORAGE_KEYS, useLocal } from "../local-store";

const FALLBACK: Lang = "fr";

export function useI18n() {
  const [stored, setLang] = useLocal<Lang>(STORAGE_KEYS.lang, FALLBACK);
  const lang: Lang = stored === "ht" ? "ht" : "fr";
  return { lang, setLang, t: dictionaries[lang] };
}

export function useTheme() {
  const [theme, setTheme] = useLocal<"light" | "dark">(STORAGE_KEYS.theme, "light");
  return { theme, setTheme };
}
