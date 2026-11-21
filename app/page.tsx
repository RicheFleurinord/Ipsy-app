"use client";

import Image from "next/image";
import Link from "next/link";
import { LangSwitch } from "@/components/Shell";
import { IconArrow, IconBook, IconChart, IconChat, IconGlobe, IconHeart, IconLeaf, IconShield, IconClock } from "@/components/icons";
import { thoughtOfTheDay } from "@/lib/i18n/dictionary";
import { useI18n } from "@/lib/i18n/use-i18n";
import { useSyncExternalStore } from "react";

const benefitIcons = [IconGlobe, IconHeart, IconClock, IconShield];

// La pensée dépend de la date du client : rendue après hydratation.
const useIsClient = () => useSyncExternalStore(() => () => {}, () => true, () => false);

export default function Home() {
  const { t, lang } = useI18n();
  const isClient = useIsClient();
  const thought = isClient ? thoughtOfTheDay(lang) : " ";

  return (
    <div className="neural-bg overflow-x-clip">
      {/* Héros */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-14 pt-10 lg:grid-cols-[1.15fr_0.85fr] lg:pt-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-turq-600 dark:text-turq-400">
            {t.home.tagline}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight text-nuit-900 sm:text-5xl lg:text-6xl dark:text-white">
            {t.home.title}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-nuit-900/75 dark:text-ciel-100/75">
            {t.home.subtitle}
          </p>

          <div className="mt-7">
            <p className="mb-2 text-sm font-medium text-nuit-900/60 dark:text-ciel-100/60">{t.home.chooseLang}</p>
            <LangSwitch large />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/discuter"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-nuit-900 px-7 text-lg font-bold text-white shadow-xl shadow-nuit-900/20 transition hover:bg-nuit-800 dark:bg-turq-400 dark:text-nuit-950 dark:hover:bg-turq-300"
            >
              <IconChat /> {t.home.cta}
            </Link>
            <Link
              href="/bien-etre"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-6 font-semibold text-nuit-900 ring-1 ring-nuit-900/15 transition hover:bg-white dark:text-ciel-100 dark:ring-white/15 dark:hover:bg-white/5"
            >
              <IconLeaf /> {t.home.ctaSecondary}
            </Link>
          </div>
        </div>

        <Link href="/discuter" aria-label={t.home.cta} className="group relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-turq-400/30 via-transparent to-nuit-700/30 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2.5rem] bg-nuit-950 ring-1 ring-turq-400/30">
            <Image
              src="/avatar/face.png"
              alt="Avatar officiel IPsy"
              width={295}
              height={380}
              priority
              className="anim-float h-auto w-full"
            />
            <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-white backdrop-blur">
              <span className="text-sm font-semibold">{t.home.cta}</span>
              <IconArrow className="transition group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      </section>

      {/* Pensée du jour */}
      <section className="mx-auto max-w-6xl px-5">
        <div className="rounded-3xl bg-gradient-to-r from-nuit-900 to-nuit-800 px-6 py-7 text-white sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-turq-300">{t.home.thoughtTitle}</p>
          <p className="mt-2 text-xl font-semibold leading-snug sm:text-2xl">« {thought} »</p>
        </div>
      </section>

      {/* Avantages */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.home.benefitsTitle}</h2>
        <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {t.home.benefits.map((b, i) => {
            const Icon = benefitIcons[i];
            return (
              <div key={b.title}>
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-turq-400/15 text-turq-600 dark:text-turq-300">
                  <Icon />
                </div>
                <h3 className="mt-4 font-bold">{b.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-nuit-900/70 dark:text-ciel-100/70">{b.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Outils */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.home.toolsTitle}</h2>
        <div className="mt-6 divide-y divide-nuit-900/10 overflow-hidden rounded-3xl bg-white ring-1 ring-nuit-900/5 dark:divide-white/10 dark:bg-nuit-900 dark:ring-white/5">
          {[
            { href: "/journal", label: t.nav.journal, text: t.home.tools.journal, Icon: IconBook },
            { href: "/evolution", label: t.nav.progress, text: t.home.tools.progress, Icon: IconChart },
            { href: "/bien-etre", label: t.nav.wellbeing, text: t.home.tools.wellbeing, Icon: IconLeaf },
          ].map(({ href, label, text, Icon }) => (
            <Link key={href} href={href} className="group flex items-center gap-4 px-5 py-5 transition hover:bg-ciel-50 dark:hover:bg-white/5">
              <Icon className="shrink-0 text-turq-600 dark:text-turq-400" width={24} height={24} />
              <div className="flex-1">
                <p className="font-bold">{label}</p>
                <p className="text-sm text-nuit-900/65 dark:text-ciel-100/65">{text}</p>
              </div>
              <IconArrow className="text-nuit-900/40 transition group-hover:translate-x-1 dark:text-ciel-100/40" />
            </Link>
          ))}
        </div>
      </section>

      {/* Limites */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="rounded-3xl border border-turq-500/30 bg-turq-400/5 p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-lg font-bold"><IconShield className="text-turq-600" /> {t.home.limitsTitle}</h2>
          <ul className="mt-4 grid gap-3 text-[15px] leading-relaxed text-nuit-900/80 sm:grid-cols-2 dark:text-ciel-100/80">
            {t.home.limits.map((l) => (
              <li key={l} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-turq-500" />{l}</li>
            ))}
          </ul>
          <Link href="/profil#confidentialite" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-turq-600 hover:underline dark:text-turq-400">
            {t.home.limitsLink} <IconArrow width={16} height={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
