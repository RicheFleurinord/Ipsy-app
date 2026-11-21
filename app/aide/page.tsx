"use client";

import Link from "next/link";
import { useState } from "react";
import Avatar from "@/components/Avatar";
import { IconAlert, IconChat, IconShield } from "@/components/icons";
import { useI18n } from "@/lib/i18n/use-i18n";
import { verifiedResources } from "@/lib/resources";

export default function HelpPage() {
  const { t, lang } = useI18n();
  const [sim, setSim] = useState(0); // 0 = non lancée, 1..n = étape affichée
  const [simAction, setSimAction] = useState(false);
  const steps = t.crisis.simSteps;

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
      {/* Bandeau prioritaire */}
      <section className="rounded-3xl bg-nuit-900 p-6 text-white sm:p-8">
        <div className="flex items-center gap-4">
          <Avatar state="soutien" size={72} priority />
          <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">{t.crisis.title}</h1>
        </div>
        <p className="mt-4 text-ciel-100/80">{t.crisis.intro}</p>
        <ol className="mt-6 space-y-4">
          {t.crisis.steps.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-turq-400 font-bold text-nuit-950">{i + 1}</span>
              <div>
                <p className="text-lg font-bold">{s.title}</p>
                <p className="mt-0.5 text-[15px] leading-relaxed text-ciel-100/80">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Ressources vérifiées */}
      <section className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-nuit-900/5 sm:p-8 dark:bg-nuit-900 dark:ring-white/5">
        <h2 className="flex items-center gap-2 text-lg font-bold"><IconShield className="text-turq-600" /> {t.crisis.resourcesTitle}</h2>
        {verifiedResources.length === 0 ? (
          <p className="mt-3 text-[15px] leading-relaxed text-nuit-900/75 dark:text-ciel-100/75">{t.crisis.resourcesEmpty}</p>
        ) : (
          <ul className="mt-4 divide-y divide-nuit-900/10 dark:divide-white/10">
            {verifiedResources.map((r) => (
              <li key={r.name} className="py-3">
                <p className="font-bold">{r.name}</p>
                <p className="text-sm text-nuit-900/70 dark:text-ciel-100/70">{r.type[lang]} · {r.zone} · {r.languages.join(", ")}</p>
                <p className="mt-1 text-lg font-bold text-turq-600">{r.contact}</p>
                <p className="text-xs text-nuit-900/50 dark:text-ciel-100/50">{t.crisis.verifiedOn} {r.verifiedOn} · {r.source}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm text-nuit-900/60 dark:text-ciel-100/60">{t.crisis.limits}</p>
        <Link href="/discuter" className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-nuit-900 px-5 font-semibold text-white hover:bg-nuit-800 dark:bg-turq-400 dark:text-nuit-950">
          <IconChat /> {t.crisis.backToChat}
        </Link>
      </section>

      {/* Simulation */}
      <section className="mt-6 rounded-3xl border-2 border-dashed border-orange-400 p-6 sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-800 dark:bg-orange-950 dark:text-orange-200">
          <IconAlert width={14} height={14} /> {t.crisis.simBadge}
        </span>
        <h2 className="mt-3 text-lg font-bold">{t.crisis.simTitle}</h2>
        <p className="mt-2 text-[15px] text-nuit-900/75 dark:text-ciel-100/75">{t.crisis.simIntro}</p>

        {sim === 0 ? (
          <button onClick={() => setSim(1)} className="mt-5 min-h-12 rounded-2xl bg-orange-600 px-5 font-bold text-white hover:bg-orange-700">
            {t.crisis.simStart}
          </button>
        ) : (
          <div className="mt-5">
            <div className="flex items-start gap-4">
              <Avatar state={sim >= 2 ? "alerte" : "reflexion"} size={80} />
              <p className="rounded-2xl rounded-tl-md bg-ciel-100 px-4 py-3 text-[15px] italic dark:bg-white/5">{t.crisis.simScenario}</p>
            </div>
            <ol className="mt-5 space-y-2 text-[15px]">
              {steps.slice(0, sim).map((s) => (
                <li key={s} className="rounded-xl bg-orange-50 px-4 py-2.5 dark:bg-orange-950/30">{s}</li>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap gap-2">
              {sim < steps.length && (
                <button onClick={() => setSim(sim + 1)} className="min-h-11 rounded-xl bg-orange-600 px-4 font-semibold text-white hover:bg-orange-700">
                  {t.wellbeing.next} →
                </button>
              )}
              {sim === steps.length && (
                <button onClick={() => setSimAction(true)} className="min-h-11 rounded-xl bg-nuit-900 px-4 font-semibold text-white dark:bg-turq-400 dark:text-nuit-950">
                  {t.crisis.simAction}
                </button>
              )}
              <button onClick={() => { setSim(0); setSimAction(false); }} className="min-h-11 rounded-xl px-4 font-semibold ring-1 ring-nuit-900/15 dark:ring-white/15">
                {t.crisis.simReset}
              </button>
            </div>
            {simAction && (
              <p role="status" className="mt-4 rounded-xl bg-nuit-900/5 px-4 py-3 text-sm font-medium dark:bg-white/5">
                ⚠️ {t.crisis.simActionResult}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
