"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/use-i18n";

const PHASES = [
  { key: "inhale", secs: 4, scale: 1 },
  { key: "hold", secs: 3, scale: 1 },
  { key: "exhale", secs: 6, scale: 0.55 },
] as const;

function Breathing() {
  const { t } = useI18n();
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [left, setLeft] = useState<number>(PHASES[0].secs);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setLeft((l) => {
        if (l > 1) return l - 1;
        setPhase((p) => {
          const next = (p + 1) % PHASES.length;
          setLeft(PHASES[next].secs);
          return next;
        });
        return l;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const cur = PHASES[phase];
  const label = t.wellbeing[cur.key];

  return (
    <section className="rounded-3xl bg-nuit-900 p-6 text-white sm:p-8">
      <h2 className="text-xl font-bold">{t.wellbeing.breathing}</h2>
      <p className="mt-1 text-ciel-100/70">{t.wellbeing.breathingText}</p>
      <div className="my-8 grid place-items-center">
        <div className="grid h-52 w-52 place-items-center rounded-full bg-turq-400/10">
          <div
            className="grid h-52 w-52 place-items-center rounded-full bg-gradient-to-br from-turq-300 to-turq-600 text-nuit-950 shadow-[0_0_60px_rgba(34,211,238,.35)]"
            style={{
              transform: `scale(${running ? cur.scale : 0.7})`,
              transition: `transform ${running ? cur.secs : 0.6}s ease-in-out`,
            }}
          >
            <div className="text-center" aria-live="polite">
              <p className="text-lg font-bold">{running ? label : "4 · 3 · 6"}</p>
              {running && <p className="text-3xl font-extrabold">{left}</p>}
            </div>
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          setPhase(0);
          setLeft(PHASES[0].secs);
          setRunning(!running);
        }}
        className="min-h-12 w-full rounded-2xl bg-white font-bold text-nuit-900 hover:bg-ciel-100"
      >
        {running ? t.wellbeing.stop : t.wellbeing.start}
      </button>
    </section>
  );
}

function Grounding() {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const steps = t.wellbeing.groundingSteps;
  const done = step >= steps.length;
  return (
    <section className="rounded-3xl bg-white p-6 ring-1 ring-nuit-900/5 sm:p-8 dark:bg-nuit-900 dark:ring-white/5">
      <h2 className="text-xl font-bold">{t.wellbeing.grounding}</h2>
      <p className="mt-1 text-nuit-900/70 dark:text-ciel-100/70">{t.wellbeing.groundingText}</p>
      <div className="mt-6 flex gap-1.5" aria-hidden>
        {steps.map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-turq-500" : "bg-nuit-900/10 dark:bg-white/10"}`} />
        ))}
      </div>
      <p className="mt-6 min-h-16 text-2xl font-bold leading-snug" aria-live="polite">
        {done ? t.wellbeing.done : `${5 - step} · ${steps[step]}`}
      </p>
      <button
        onClick={() => setStep(done ? 0 : step + 1)}
        className="mt-6 min-h-12 w-full rounded-2xl bg-nuit-900 font-bold text-white hover:bg-nuit-800 dark:bg-turq-400 dark:text-nuit-950"
      >
        {done ? t.wellbeing.restart : step === 0 ? t.wellbeing.start : t.wellbeing.next}
      </button>
    </section>
  );
}

function Pause() {
  const { t } = useI18n();
  const TOTAL = 120;
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (left === null || left <= 0) return;
    const id = window.setTimeout(() => setLeft(left - 1), 1000);
    return () => window.clearTimeout(id);
  }, [left]);

  const running = left !== null && left > 0;
  const mm = Math.floor((left ?? TOTAL) / 60);
  const ss = String((left ?? TOTAL) % 60).padStart(2, "0");
  const pct = left === null ? 0 : ((TOTAL - left) / TOTAL) * 100;

  return (
    <section className="rounded-3xl bg-white p-6 ring-1 ring-nuit-900/5 sm:p-8 dark:bg-nuit-900 dark:ring-white/5">
      <h2 className="text-xl font-bold">{t.wellbeing.pause}</h2>
      <p className="mt-1 text-nuit-900/70 dark:text-ciel-100/70">{t.wellbeing.pauseText}</p>
      <p className="mt-6 text-5xl font-extrabold tabular-nums" aria-live="polite">{mm}:{ss}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-nuit-900/10 dark:bg-white/10">
        <div className="h-full bg-turq-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
      {left === 0 && <p className="mt-4 font-semibold text-turq-600 dark:text-turq-400">{t.wellbeing.pauseDone}</p>}
      <button
        onClick={() => setLeft(running ? null : TOTAL)}
        className="mt-6 min-h-12 w-full rounded-2xl bg-nuit-900 font-bold text-white hover:bg-nuit-800 dark:bg-turq-400 dark:text-nuit-950"
      >
        {running ? t.wellbeing.stop : left === 0 ? t.wellbeing.restart : t.wellbeing.start}
      </button>
    </section>
  );
}

export default function WellbeingPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">{t.wellbeing.title}</h1>
      <p className="mt-2 text-nuit-900/70 dark:text-ciel-100/70">{t.wellbeing.subtitle}</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Breathing />
        <div className="space-y-6">
          <Grounding />
          <Pause />
        </div>
      </div>
    </div>
  );
}
