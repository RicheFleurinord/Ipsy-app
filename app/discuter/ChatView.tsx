"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import Avatar, { type AvatarState } from "@/components/Avatar";
import { IconAlert, IconFlag, IconLifebuoy, IconPlus, IconSend, IconShield, IconTrash } from "@/components/icons";
import type { Level } from "@/lib/ai/safety";
import { chatStore, useChatMessages, useNoticeAccepted, type UiMessage } from "@/lib/chat-store";
import { useI18n } from "@/lib/i18n/use-i18n";
import { readLocal, STORAGE_KEYS, writeLocal } from "@/lib/local-store";

type Status = "idle" | "loading" | "streaming";

const uid = () => Math.random().toString(36).slice(2, 10);

/** Rendu minimal et sûr : paragraphes + **gras**, sans HTML injecté. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}|\n/).map((para, i) => (
        <p key={i} className="[&:not(:first-child)]:mt-2">
          {para.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j}>{part.slice(2, -2)}</strong>
            ) : (
              <Fragment key={j}>{part.replace(/^\s*[-*]\s+/, "• ")}</Fragment>
            ),
          )}
        </p>
      ))}
    </>
  );
}

export default function ChatView() {
  const { t, lang } = useI18n();
  const messages = useChatMessages();
  const noticeAccepted = useNoticeAccepted();
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [focused, setFocused] = useState(false);
  const [afterglow, setAfterglow] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const lastAssistant = [...messages].reverse().find((m) => m.role !== "user");
  const currentLevel: Level = lastAssistant?.level ?? "vert";
  const hasError = !!lastAssistant?.errorCode;

  // État de l'avatar synchronisé avec le fonctionnement réel du chat.
  let avatar: AvatarState = "repos";
  if (status === "loading") avatar = "reflexion";
  else if (status === "streaming") avatar = currentLevel === "rouge" ? "alerte" : "parole";
  else if (focused && input.trim()) avatar = "ecoute";
  else if (currentLevel === "rouge" || hasError) avatar = "alerte";
  else if (currentLevel === "orange" || afterglow) avatar = "soutien";

  const statusLabel = hasError && status === "idle" ? t.chat.systemLabel : t.chat.states[avatar];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(text: string) {
    const content = text.trim();
    if (!content || status !== "idle") return;
    setInput("");
    setAfterglow(false);

    const userMsg: UiMessage = { id: uid(), role: "user", content };
    // Retirer un éventuel message d'erreur système avant de renvoyer.
    const history = [...chatStore.get().filter((m) => m.role !== "system"), userMsg];
    chatStore.set(history);
    setStatus("loading");

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const assistantId = uid();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          lang,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) {
        const code = await res.json().then((j) => j.error as string).catch(() => "upstream");
        throw Object.assign(new Error(code), { code });
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let level: Level | null = null;
      let started = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        if (!level) {
          const nl = buf.indexOf("\n");
          if (nl < 0) continue;
          const l = buf.slice(0, nl).trim();
          level = l === "rouge" || l === "orange" ? l : "vert";
          buf = buf.slice(nl + 1);
        }
        const failed = buf.includes("[[IPSY_ERROR]]");
        const shown = buf.replace("\n[[IPSY_ERROR]]", "").replace("[[IPSY_ERROR]]", "");
        if (!started) {
          started = true;
          setStatus("streaming");
          chatStore.set((prev) => [...prev, { id: assistantId, role: "assistant", content: shown, level: level! }]);
        } else {
          chatStore.set((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: shown } : m)));
        }
        if (failed) throw Object.assign(new Error("upstream"), { code: "partial" });
      }
      if (!started) throw Object.assign(new Error("blocked"), { code: "blocked" });
      setAfterglow(true);
      window.setTimeout(() => setAfterglow(false), 5000);
    } catch (e) {
      if (ctrl.signal.aborted) return;
      const code = (e as { code?: string }).code ?? "network";
      const map: Record<string, string> = {
        config: t.chat.errorConfig,
        rate: t.chat.errorRate,
        blocked: t.chat.errorBlocked,
        upstream: t.chat.errorServer,
        partial: t.chat.errorServer,
        bad_request: t.chat.errorServer,
      };
      const msg = e instanceof TypeError ? t.chat.errorNetwork : map[code] ?? t.chat.errorServer;
      chatStore.set((prev) => [...prev, { id: uid(), role: "system", content: msg, errorCode: code }]);
      if (code !== "partial") setInput((cur) => cur || content);
    } finally {
      if (abortRef.current === ctrl) {
        abortRef.current = null;
        setStatus("idle");
      }
    }
  }

  function reset(confirmFirst: boolean) {
    if (confirmFirst && chatStore.get().length && !window.confirm(t.chat.clearConfirm)) return;
    abortRef.current?.abort();
    abortRef.current = null;
    chatStore.set([]);
    setStatus("idle");
    setAfterglow(false);
    setInput("");
    inputRef.current?.focus();
  }

  function report(id: string) {
    const n = readLocal<number>(STORAGE_KEYS.reports, 0);
    writeLocal(STORAGE_KEYS.reports, n + 1); // seul un compteur est stocké, jamais le contenu
    chatStore.set((prev) => prev.map((m) => (m.id === id ? { ...m, reported: true } : m)));
  }

  const busy = status !== "idle";
  const noUserMsg = !messages.some((m) => m.role === "user");

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-6xl gap-6 px-0 pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:px-5 lg:pb-5 lg:pt-5">
      {/* Panneau avatar (desktop) */}
      <aside className="hidden w-80 shrink-0 flex-col items-center rounded-3xl bg-nuit-900 p-6 text-white lg:flex">
        <Avatar state={avatar} size={220} priority label={statusLabel} />
        <p className="mt-5 text-lg font-semibold" aria-live="polite">{statusLabel}</p>
        <p className="mt-1 text-center text-sm text-ciel-100/60">{t.chat.langHint}</p>
        <div className="mt-auto w-full space-y-2">
          <Link href="/aide" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-sm font-bold hover:bg-orange-700">
            <IconLifebuoy /> {t.help.button}
          </Link>
          <button onClick={() => reset(false)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15">
            <IconPlus /> {t.chat.newChat}
          </button>
          <button onClick={() => reset(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-ciel-100/70 hover:bg-white/5 hover:text-white">
            <IconTrash /> {t.chat.clear}
          </button>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white lg:rounded-3xl lg:ring-1 lg:ring-nuit-900/5 dark:bg-nuit-900 dark:lg:ring-white/5">
        {/* En-tête mobile */}
        <div className="flex items-center gap-3 border-b border-nuit-900/5 px-4 py-3 lg:hidden dark:border-white/5">
          <Avatar state={avatar} size={56} priority label={statusLabel} />
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-tight">IPsy</p>
            <p className="truncate text-sm text-nuit-900/60 dark:text-ciel-100/60" aria-live="polite">{statusLabel}</p>
          </div>
          <button onClick={() => reset(false)} aria-label={t.chat.newChat} title={t.chat.newChat} className="grid h-11 w-11 place-items-center rounded-full hover:bg-nuit-900/5 dark:hover:bg-white/10"><IconPlus /></button>
          <button onClick={() => reset(true)} aria-label={t.chat.clear} title={t.chat.clear} className="grid h-11 w-11 place-items-center rounded-full hover:bg-nuit-900/5 dark:hover:bg-white/10"><IconTrash /></button>
          <Link href="/aide" aria-label={t.help.button} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-orange-600 px-3 text-sm font-bold text-white"><IconLifebuoy /> {t.help.short}</Link>
        </div>

        {/* Fil de discussion */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite">
          <Bubble role="assistant">
            <p>{t.chat.welcome}</p>
          </Bubble>

          {messages.map((m) => (
            <div key={m.id}>
              {m.role === "system" ? (
                <div className="mx-auto flex max-w-lg items-start gap-2 rounded-2xl bg-orange-50 px-4 py-3 text-sm text-orange-900 ring-1 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-100 dark:ring-orange-900">
                  <IconAlert className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{t.chat.systemLabel}</p>
                    <p className="mt-0.5">{m.content}</p>
                  </div>
                </div>
              ) : (
                <Bubble role={m.role}>
                  <RichText text={m.content} />
                </Bubble>
              )}
              {m.role === "assistant" && (
                <>
                  {m.level === "rouge" && <SafetyCard tone="red" title={t.chat.redTitle} text={t.chat.redText} cta={t.chat.openHelp} />}
                  {m.level === "orange" && <SafetyCard tone="orange" title={t.chat.orangeTitle} text={t.chat.orangeText} cta={t.chat.openHelp} />}
                  <div className="ml-1 mt-1 flex items-center gap-3 text-xs text-nuit-900/45 dark:text-ciel-100/40">
                    <span>IA · IPsy</span>
                    {m.reported ? (
                      <span>{t.chat.reported}</span>
                    ) : (
                      <button onClick={() => report(m.id)} className="inline-flex items-center gap-1 hover:text-nuit-900 dark:hover:text-white">
                        <IconFlag width={14} height={14} /> {t.chat.report}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}

          {status === "loading" && (
            <Bubble role="assistant">
              <span className="inline-flex gap-1 py-1" aria-label={t.chat.states.reflexion}>
                <span className="typing-dot h-2 w-2 rounded-full bg-turq-500" />
                <span className="typing-dot h-2 w-2 rounded-full bg-turq-500" />
                <span className="typing-dot h-2 w-2 rounded-full bg-turq-500" />
              </span>
            </Bubble>
          )}

          {noUserMsg && status === "idle" && (
            <div className="pt-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-nuit-900/50 dark:text-ciel-100/50">{t.chat.suggestionsTitle}</p>
              <div className="flex flex-wrap gap-2">
                {t.chat.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={!noticeAccepted}
                    className="rounded-2xl bg-ciel-100 px-3.5 py-2 text-left text-sm text-nuit-900 transition hover:bg-ciel-200 disabled:opacity-50 dark:bg-white/5 dark:text-ciel-100 dark:hover:bg-white/10"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Saisie */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-nuit-900/5 p-3 sm:p-4 dark:border-white/5"
        >
          <div className="flex items-end gap-2 rounded-2xl bg-ciel-50 p-2 ring-1 ring-nuit-900/10 focus-within:ring-2 focus-within:ring-turq-500 dark:bg-nuit-950 dark:ring-white/10">
            <label htmlFor="chat-input" className="sr-only">{t.chat.placeholder}</label>
            <textarea
              id="chat-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 2000))}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder={t.chat.placeholder}
              disabled={!noticeAccepted}
              className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-base outline-none placeholder:text-nuit-900/40 dark:placeholder:text-ciel-100/40"
            />
            <button
              type="submit"
              disabled={busy || !input.trim() || !noticeAccepted}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-nuit-900 px-4 font-semibold text-white transition hover:bg-nuit-800 disabled:opacity-40 dark:bg-turq-400 dark:text-nuit-950"
            >
              <span className="hidden sm:inline">{t.chat.send}</span>
              <IconSend />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-nuit-900/45 dark:text-ciel-100/40">
            {t.chat.aiDisclaimer} · {t.chat.langHint}
          </p>
        </form>
      </section>

      {!noticeAccepted && <Notice />}
    </div>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: ReactNode }) {
  const mine = role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-3xl px-4 py-3 text-[15px] leading-relaxed sm:max-w-[75%] ${
          mine
            ? "rounded-br-lg bg-nuit-900 text-white dark:bg-turq-500 dark:text-nuit-950"
            : "rounded-bl-lg bg-ciel-100 text-nuit-900 dark:bg-white/5 dark:text-ciel-100"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function SafetyCard({ tone, title, text, cta }: { tone: "red" | "orange"; title: string; text: string; cta: string }) {
  const red = tone === "red";
  return (
    <div
      role={red ? "alert" : "status"}
      className={`mt-3 max-w-[85%] rounded-2xl p-4 text-sm sm:max-w-[75%] ${
        red
          ? "bg-orange-600 text-white"
          : "bg-amber-50 text-amber-950 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-100 dark:ring-amber-900"
      }`}
    >
      <p className="font-bold">{title}</p>
      <p className="mt-1 opacity-90">{text}</p>
      <Link
        href="/aide"
        className={`mt-3 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-semibold ${
          red ? "bg-white text-orange-700" : "bg-amber-600 text-white"
        }`}
      >
        <IconLifebuoy width={16} height={16} /> {cta}
      </Link>
    </div>
  );
}

function Notice() {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-nuit-950/50 p-0 backdrop-blur-sm sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="notice-title">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl dark:bg-nuit-900">
        <div className="flex items-center gap-3">
          <Avatar state="soutien" size={56} />
          <h2 id="notice-title" className="text-xl font-bold">{t.chat.noticeTitle}</h2>
        </div>
        <ul className="mt-5 space-y-3 text-[15px] leading-relaxed text-nuit-900/80 dark:text-ciel-100/80">
          {t.chat.noticeItems.map((n) => (
            <li key={n} className="flex gap-2.5"><IconShield className="mt-0.5 shrink-0 text-turq-600" width={18} height={18} />{n}</li>
          ))}
        </ul>
        <button
          autoFocus
          onClick={() => chatStore.acceptNotice()}
          className="mt-6 min-h-12 w-full rounded-2xl bg-nuit-900 font-bold text-white hover:bg-nuit-800 dark:bg-turq-400 dark:text-nuit-950"
        >
          {t.chat.noticeAccept}
        </button>
      </div>
    </div>
  );
}
