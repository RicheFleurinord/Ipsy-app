"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";
import { LangSwitch, ThemeToggle } from "@/components/Shell";
import { IconShield, IconTrash } from "@/components/icons";
import { useI18n } from "@/lib/i18n/use-i18n";
import { removeLocal, STORAGE_KEYS } from "@/lib/local-store";

export default function ProfilePage() {
  const { t } = useI18n();
  const [cleared, setCleared] = useState(false);

  function clearAll() {
    if (!window.confirm(t.profile.clearAllConfirm)) return;
    removeLocal(Object.values(STORAGE_KEYS));
    setCleared(true);
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
      <div className="flex items-center gap-4">
        <Avatar state="repos" size={72} />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t.profile.title}</h1>
          <p className="text-nuit-900/70 dark:text-ciel-100/70">{t.profile.subtitle}</p>
        </div>
      </div>

      <div className="mt-8 divide-y divide-nuit-900/10 rounded-3xl bg-white ring-1 ring-nuit-900/5 dark:divide-white/10 dark:bg-nuit-900 dark:ring-white/5">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="font-semibold">{t.profile.demoUser}</p>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800 dark:bg-orange-950 dark:text-orange-200">DEMO</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="font-semibold">{t.profile.language}</p>
          <LangSwitch />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="font-semibold">{t.profile.theme}</p>
          <ThemeToggle />
        </div>
        <div className="p-5">
          <p className="font-semibold">{t.profile.data}</p>
          <p className="mt-1 text-sm text-nuit-900/70 dark:text-ciel-100/70">{t.profile.dataText}</p>
          <button onClick={clearAll} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-orange-700 ring-1 ring-orange-300 hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-white/5">
            <IconTrash width={18} height={18} /> {t.profile.clearAll}
          </button>
          {cleared && <p role="status" className="mt-2 text-sm font-medium text-turq-600">{t.profile.cleared}</p>}
        </div>
      </div>

      <section id="confidentialite" className="mt-8 scroll-mt-24 rounded-3xl border border-turq-500/30 bg-turq-400/5 p-6 sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-bold"><IconShield className="text-turq-600" /> {t.profile.privacyTitle}</h2>
        <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-nuit-900/80 dark:text-ciel-100/80">
          {t.profile.privacy.map((p) => (
            <li key={p} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-turq-500" />{p}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
