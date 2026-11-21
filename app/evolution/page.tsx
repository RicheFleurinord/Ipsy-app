"use client";

import ClientOnly from "@/components/ClientOnly";
import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/use-i18n";
import { makeDemoMoods, MOOD_EMOJI, useDemoMoods, useJournal } from "@/lib/journal";

function ProgressPage() {
  const { t, lang } = useI18n();
  const [journal] = useJournal();
  const [demo, setDemo] = useDemoMoods();
  const [range, setRange] = useState<7 | 30>(7);

  // Une valeur par jour (moyenne si plusieurs entrées le même jour).
  const days: { date: string; mood: number | null; demo: boolean }[] = [];
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const real = journal.filter((e) => e.date === iso && e.mood).map((e) => e.mood!);
    const fake = demo.filter((e) => e.date === iso && e.mood).map((e) => e.mood!);
    const vals = real.length ? real : fake;
    days.push({ date: iso, mood: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null, demo: !real.length && fake.length > 0 });
  }
  const points = days.filter((d) => d.mood !== null);
  const usesDemo = days.some((d) => d.demo);
  const avg = points.length ? points.reduce((a, d) => a + d.mood!, 0) / points.length : null;
  const last = points.at(-1)?.mood ?? null;

  // Graphique SVG
  const W = 640, H = 220, P = 28;
  const x = (i: number) => P + (i * (W - 2 * P)) / Math.max(1, range - 1);
  const y = (m: number) => H - P - ((m - 1) * (H - 2 * P)) / 4;
  const path = days
    .map((d, i) => (d.mood === null ? null : `${x(i)},${y(d.mood)}`))
    .filter(Boolean)
    .join(" L ");

  const label = (iso: string) =>
    new Date(iso + "T12:00:00").toLocaleDateString(lang === "ht" ? "fr-HT" : "fr-FR", { day: "numeric", month: "short" });

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">{t.progress.title}</h1>
      <p className="mt-2 text-nuit-900/70 dark:text-ciel-100/70">{t.progress.subtitle}</p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {([7, 30] as const).map((r) => (
          <button key={r} onClick={() => setRange(r)} aria-pressed={range === r} className={`min-h-10 rounded-full px-4 text-sm font-semibold ${range === r ? "bg-nuit-900 text-white dark:bg-turq-400 dark:text-nuit-950" : "ring-1 ring-nuit-900/15 dark:ring-white/15"}`}>
            {r === 7 ? t.progress.days7 : t.progress.days30}
          </button>
        ))}
        <span className="flex-1" />
        {demo.length ? (
          <button onClick={() => setDemo([])} className="min-h-10 rounded-full px-4 text-sm font-semibold text-orange-700 ring-1 ring-orange-300 dark:text-orange-300">{t.progress.clearDemo}</button>
        ) : (
          <button onClick={() => setDemo(makeDemoMoods())} className="min-h-10 rounded-full px-4 text-sm font-semibold ring-1 ring-nuit-900/15 dark:ring-white/15">{t.progress.loadDemo}</button>
        )}
      </div>

      <div className="mt-4 rounded-3xl bg-white p-4 ring-1 ring-nuit-900/5 sm:p-6 dark:bg-nuit-900 dark:ring-white/5">
        {usesDemo && (
          <span className="mb-3 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-800 dark:bg-orange-950 dark:text-orange-200">
            {t.progress.demoBadge}
          </span>
        )}
        {points.length === 0 ? (
          <p className="py-10 text-center text-nuit-900/60 dark:text-ciel-100/60">
            {t.progress.empty} <Link href="/journal" className="font-semibold text-turq-600 underline">{t.nav.journal}</Link>
          </p>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={t.progress.title}>
            {[1, 2, 3, 4, 5].map((m) => (
              <g key={m}>
                <line x1={P} x2={W - P} y1={y(m)} y2={y(m)} className="stroke-nuit-900/10 dark:stroke-white/10" strokeDasharray="3 5" />
                <text x={4} y={y(m) + 5} fontSize="14">{MOOD_EMOJI[m]}</text>
              </g>
            ))}
            {path && <path d={`M ${path}`} fill="none" className="stroke-turq-500" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
            {days.map((d, i) =>
              d.mood === null ? null : (
                <circle key={d.date} cx={x(i)} cy={y(d.mood)} r={range === 7 ? 6 : 4} className={d.demo ? "fill-white stroke-turq-500 dark:fill-nuit-900" : "fill-nuit-900 stroke-white dark:fill-turq-400 dark:stroke-nuit-900"} strokeWidth="2">
                  <title>{`${label(d.date)} — ${t.moods[Math.round(d.mood)]}${d.demo ? ` (${t.progress.demoBadge})` : ""}`}</title>
                </circle>
              ),
            )}
            <text x={P} y={H - 4} fontSize="12" className="fill-nuit-900/50 dark:fill-ciel-100/50">{label(days[0].date)}</text>
            <text x={W - P} y={H - 4} fontSize="12" textAnchor="end" className="fill-nuit-900/50 dark:fill-ciel-100/50">{label(days[days.length - 1].date)}</text>
          </svg>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3">
        {[
          { k: t.progress.entries, v: String(points.length) },
          { k: t.progress.average, v: avg ? `${MOOD_EMOJI[Math.round(avg)]} ${avg.toFixed(1)}/5` : "—" },
          { k: t.progress.lastMood, v: last ? `${MOOD_EMOJI[Math.round(last)]} ${t.moods[Math.round(last)]}` : "—" },
        ].map((s) => (
          <div key={s.k} className="rounded-2xl bg-white p-4 ring-1 ring-nuit-900/5 dark:bg-nuit-900 dark:ring-white/5">
            <dt className="text-xs font-medium text-nuit-900/60 dark:text-ciel-100/60">{s.k}</dt>
            <dd className="mt-1 text-lg font-bold">{s.v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-nuit-900/60 dark:text-ciel-100/60">{t.progress.notClinical}</p>
    </div>
  );
}

export default function Page() {
  return (
    <ClientOnly>
      <ProgressPage />
    </ClientOnly>
  );
}
