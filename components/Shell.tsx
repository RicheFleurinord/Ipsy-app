"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useI18n, useTheme } from "@/lib/i18n/use-i18n";
import {
  IconBook, IconChart, IconChat, IconHome, IconLeaf, IconLifebuoy, IconMoon, IconSun, IconUser,
} from "./icons";

export function useNavItems() {
  const { t } = useI18n();
  return [
    { href: "/", label: t.nav.home, Icon: IconHome },
    { href: "/discuter", label: t.nav.chat, Icon: IconChat },
    { href: "/journal", label: t.nav.journal, Icon: IconBook },
    { href: "/evolution", label: t.nav.progress, Icon: IconChart },
    { href: "/bien-etre", label: t.nav.wellbeing, Icon: IconLeaf },
    { href: "/profil", label: t.nav.profile, Icon: IconUser },
  ];
}

/** Synchronise <html lang> et la classe dark avec les préférences locales. */
export function PrefsSync() {
  const { lang } = useI18n();
  const { theme } = useTheme();
  useEffect(() => {
    document.documentElement.lang = lang === "ht" ? "ht" : "fr";
  }, [lang]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  return null;
}

export function LangSwitch({ large = false }: { large?: boolean }) {
  const { lang, setLang } = useI18n();
  const opts = [
    { v: "fr" as const, l: "Français" },
    { v: "ht" as const, l: "Kreyòl" },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Langue / Lang"
      className={`inline-flex rounded-full bg-white/80 p-1 ring-1 ring-nuit-900/10 dark:bg-nuit-900 dark:ring-white/10 ${large ? "text-base" : "text-sm"}`}
    >
      {opts.map((o) => (
        <button
          key={o.v}
          role="radio"
          aria-checked={lang === o.v}
          onClick={() => setLang(o.v)}
          className={`rounded-full font-semibold transition ${large ? "px-5 py-2.5" : "px-3 py-1.5"} ${
            lang === o.v
              ? "bg-nuit-900 text-white shadow-sm dark:bg-turq-400 dark:text-nuit-950"
              : "text-nuit-900/70 hover:text-nuit-900 dark:text-ciel-100/70 dark:hover:text-white"
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const dark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? t.theme.light : t.theme.dark}
      title={dark ? t.theme.light : t.theme.dark}
      className="grid h-10 w-10 place-items-center rounded-full text-nuit-900/70 hover:bg-nuit-900/5 dark:text-ciel-100/80 dark:hover:bg-white/10"
    >
      {dark ? <IconSun /> : <IconMoon />}
    </button>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="IPsy — Accueil">
      <Image src="/avatar/logo-cerveau.png" alt="" width={36} height={36} className="rounded-xl" priority />
      <span className="text-xl font-extrabold tracking-tight">
        I<span className="text-turq-500">Psy</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const items = useNavItems();
  const path = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-nuit-900/5 bg-ciel-50/85 backdrop-blur dark:border-white/5 dark:bg-nuit-950/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
          {items.map(({ href, label }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-nuit-900 text-white dark:bg-white/10"
                    : "text-nuit-900/70 hover:text-nuit-900 dark:text-ciel-100/70 dark:hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1.5">
          <LangSwitch />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const items = useNavItems().filter((i) => i.href !== "/bien-etre");
  const path = usePathname();
  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-nuit-900/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden dark:border-white/10 dark:bg-nuit-950/95"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                  active ? "text-turq-600 dark:text-turq-400" : "text-nuit-900/60 dark:text-ciel-100/60"
                }`}
              >
                <Icon width={22} height={22} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function HelpButton() {
  const { t } = useI18n();
  const path = usePathname();
  // /aide est la page d'aide elle-même ; /discuter intègre son propre bouton d'aide.
  if (path.startsWith("/aide") || path.startsWith("/discuter")) return null;
  return (
    <Link
      href="/aide"
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex items-center gap-2 rounded-full bg-orange-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-900/20 transition hover:bg-orange-700 focus-visible:outline-4 focus-visible:outline-orange-300 lg:bottom-6 lg:right-6"
    >
      <IconLifebuoy />
      <span>{t.help.button}</span>
    </Link>
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-nuit-900/5 pb-28 pt-8 text-center text-xs text-nuit-900/60 lg:pb-10 dark:border-white/5 dark:text-ciel-100/50">
      <p>{t.footer.disclaimer}</p>
      <p className="mt-1">{t.footer.rights}</p>
    </footer>
  );
}
