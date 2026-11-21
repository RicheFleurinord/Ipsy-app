"use client";

import ClientOnly from "@/components/ClientOnly";
import { useState } from "react";
import { IconEdit, IconTrash } from "@/components/icons";
import { useI18n } from "@/lib/i18n/use-i18n";
import { MOOD_EMOJI, todayISO, useJournal, type Entry } from "@/lib/journal";

function JournalPage() {
  const { t, lang } = useI18n();
  const [entries, setEntries] = useJournal();
  const [text, setText] = useState("");
  const [date, setDate] = useState(todayISO);
  const [mood, setMood] = useState<number | undefined>(undefined);
  const [editing, setEditing] = useState<string | null>(null);

  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  function resetForm() {
    setText("");
    setDate(todayISO());
    setMood(undefined);
    setEditing(null);
  }

  function save() {
    if (!text.trim()) return;
    if (editing) {
      setEntries(entries.map((e) => (e.id === editing ? { ...e, text: text.trim(), date, mood } : e)));
    } else {
      setEntries([...entries, { id: crypto.randomUUID(), text: text.trim(), date, mood }]);
    }
    resetForm();
  }

  function edit(e: Entry) {
    setEditing(e.id);
    setText(e.text);
    setDate(e.date);
    setMood(e.mood);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function remove(id: string) {
    if (!window.confirm(t.journal.deleteConfirm)) return;
    setEntries(entries.filter((e) => e.id !== id));
    if (editing === id) resetForm();
  }

  const fmt = (iso: string) =>
    new Date(iso + "T12:00:00").toLocaleDateString(lang === "ht" ? "fr-HT" : "fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">{t.journal.title}</h1>
      <p className="mt-2 text-nuit-900/70 dark:text-ciel-100/70">{t.journal.subtitle}</p>
      <p className="mt-1 text-sm font-medium text-orange-700 dark:text-orange-300">{t.journal.demoNote}</p>

      <form
        onSubmit={(e) => { e.preventDefault(); save(); }}
        className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-nuit-900/5 sm:p-6 dark:bg-nuit-900 dark:ring-white/5"
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {t.journal.prompts.map((p) => (
            <button type="button" key={p} onClick={() => setText((cur) => (cur ? cur : p + " "))} className="rounded-full bg-ciel-100 px-3 py-1.5 text-xs font-medium hover:bg-ciel-200 dark:bg-white/5 dark:hover:bg-white/10">
              {p}
            </button>
          ))}
        </div>
        <label htmlFor="journal-text" className="sr-only">{t.journal.placeholder}</label>
        <textarea
          id="journal-text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 3000))}
          placeholder={t.journal.placeholder}
          rows={5}
          className="w-full resize-y rounded-2xl bg-ciel-50 p-4 text-base outline-none ring-1 ring-nuit-900/10 focus:ring-2 focus:ring-turq-500 dark:bg-nuit-950 dark:ring-white/10"
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr]">
          <label className="text-sm font-medium">
            {t.journal.date}
            <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value || todayISO())} className="mt-1 block min-h-11 rounded-xl bg-ciel-50 px-3 ring-1 ring-nuit-900/10 dark:bg-nuit-950 dark:ring-white/10" />
          </label>
          <fieldset>
            <legend className="text-sm font-medium">{t.journal.mood}</legend>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMood(mood === m ? undefined : m)}
                  aria-pressed={mood === m}
                  title={t.moods[m]}
                  className={`flex min-h-11 items-center gap-1 rounded-xl px-2.5 text-sm transition ${mood === m ? "bg-nuit-900 text-white dark:bg-turq-400 dark:text-nuit-950" : "bg-ciel-50 ring-1 ring-nuit-900/10 hover:bg-ciel-100 dark:bg-nuit-950 dark:ring-white/10"}`}
                >
                  <span className="text-lg">{MOOD_EMOJI[m]}</span>
                  <span className="hidden sm:inline">{t.moods[m]}</span>
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="mt-5 flex gap-2">
          <button type="submit" disabled={!text.trim()} className="min-h-12 rounded-2xl bg-nuit-900 px-6 font-bold text-white hover:bg-nuit-800 disabled:opacity-40 dark:bg-turq-400 dark:text-nuit-950">
            {editing ? t.journal.update : t.journal.save}
          </button>
          {editing && (
            <button type="button" onClick={resetForm} className="min-h-12 rounded-2xl px-5 font-semibold ring-1 ring-nuit-900/15 dark:ring-white/15">
              {t.journal.cancel}
            </button>
          )}
        </div>
      </form>

      <ul className="mt-8 space-y-3">
        {sorted.length === 0 && <li className="rounded-2xl bg-ciel-100 p-5 text-center text-nuit-900/70 dark:bg-white/5 dark:text-ciel-100/70">{t.journal.empty}</li>}
        {sorted.map((e) => (
          <li key={e.id} className={`rounded-2xl bg-white p-5 ring-1 ring-nuit-900/5 dark:bg-nuit-900 dark:ring-white/5 ${editing === e.id ? "ring-2 ring-turq-500" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold capitalize text-nuit-900/60 dark:text-ciel-100/60">{fmt(e.date)}</p>
                {e.mood && <p className="mt-0.5 text-sm">{MOOD_EMOJI[e.mood]} {t.moods[e.mood]}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => edit(e)} aria-label={t.journal.edit} title={t.journal.edit} className="grid h-10 w-10 place-items-center rounded-full hover:bg-nuit-900/5 dark:hover:bg-white/10"><IconEdit width={18} height={18} /></button>
                <button onClick={() => remove(e.id)} aria-label={t.journal.delete} title={t.journal.delete} className="grid h-10 w-10 place-items-center rounded-full text-orange-700 hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-white/10"><IconTrash width={18} height={18} /></button>
              </div>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">{e.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Page() {
  return (
    <ClientOnly>
      <JournalPage />
    </ClientOnly>
  );
}
