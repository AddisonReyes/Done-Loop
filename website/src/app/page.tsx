"use client";

import { useState } from "react";

import { Footer } from "./shared/footer";
import { LanguageSelect } from "./shared/language-select";
import type { Language, Localized } from "./shared/types";

const playStoreHref = "#google-play";

type HomeCopy = {
  languageLabel: string;
  heroTitle: string;
  heroText: string;
  playCta: string;
  featureTitle: string;
  featureText: string;
  features: [string, string][];
  finalTitle: string;
  finalText: string;
};

const translations = {
  en: {
    languageLabel: "Language",
    heroTitle: "Keep your day moving in one quiet loop.",
    heroText:
      "Done Loop brings habits, tasks, calendar context, reminders, and personalization into a focused mobile app that works from your device first.",
    playCta: "Download on Google Play",
    featureTitle: "Built for daily follow-through",
    featureText:
      "A simple system for seeing what matters, checking it off, and returning tomorrow without noise.",
    features: [
      ["One daily surface", "Habits, tasks, and calendar context stay in one calm place."],
      ["Local reminders", "Use device notifications for habits and dated tasks without account setup."],
      ["Personal rhythm", "Choose language, date format, theme, and accent color."],
    ],
    finalTitle: "Start with one loop.",
    finalText: "Done Loop is available for Android on Google Play.",
  },
  es: {
    languageLabel: "Idioma",
    heroTitle: "Mantén tu día avanzando en un ciclo tranquilo.",
    heroText:
      "Done Loop reúne hábitos, tareas, calendario, recordatorios y personalización en una app móvil enfocada que funciona primero desde tu dispositivo.",
    playCta: "Descargar en Google Play",
    featureTitle: "Creada para cumplir cada día",
    featureText:
      "Un sistema simple para ver lo importante, marcarlo como hecho y volver mañana sin ruido.",
    features: [
      ["Una superficie diaria", "Hábitos, tareas y calendario conviven en un lugar tranquilo."],
      ["Recordatorios locales", "Usa notificaciones del dispositivo para hábitos y tareas sin crear cuenta."],
      ["Ritmo personal", "Elige idioma, formato de fecha, tema y color de acento."],
    ],
    finalTitle: "Empieza con un ciclo.",
    finalText: "Done Loop está disponible para Android en Google Play.",
  },
} satisfies Localized<HomeCopy>;

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const copy = translations[language];

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="ambient-background" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-5 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between gap-4">
          <p className="font-serif text-xl font-semibold tracking-[-0.02em] text-accent-strong">Done Loop</p>
          <LanguageSelect language={language} label={copy.languageLabel} onChange={setLanguage} />
        </div>

        <section className="flex flex-1 flex-col items-center justify-center py-16 text-center md:py-24">
          <div className="mx-auto max-w-4xl">
            <h1 className="font-serif text-5xl font-bold leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-[4.75rem]">
              {copy.heroTitle}
            </h1>
            <p className="mx-auto mt-6 max-w-[46rem] text-lg leading-8 text-text-secondary sm:text-xl">{copy.heroText}</p>
            <div className="mx-auto mt-8 max-w-sm">
              <a className="block rounded-2xl bg-accent px-6 py-4 text-center font-bold text-white transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent-strong focus:ring-offset-2 focus:ring-offset-background" href={playStoreHref}>
                {copy.playCta}
              </a>
            </div>
          </div>
        </section>

        <section className="py-10 md:py-16">
          <div className="max-w-2xl">
            <h2 className="font-serif text-4xl font-bold tracking-[-0.035em] sm:text-5xl">{copy.featureTitle}</h2>
            <p className="mt-4 text-lg leading-8 text-text-secondary">{copy.featureText}</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {copy.features.map(([title, body]) => (
              <article key={title} className="rounded-3xl border border-border bg-surface/82 p-6 shadow-[0_18px_58px_rgba(0,0,0,0.2)] backdrop-blur">
                <span className="mb-5 block h-1.5 w-10 rounded-full bg-accent" />
                <h3 className="font-serif text-2xl font-semibold leading-8">{title}</h3>
                <p className="mt-3 leading-7 text-text-secondary">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="google-play" className="my-10 flex flex-col gap-6 rounded-[2rem] border border-border-strong bg-surface p-7 shadow-[0_22px_70px_rgba(0,0,0,0.24)] md:flex-row md:items-center md:justify-between md:p-9">
          <div className="max-w-xl">
            <h2 className="font-serif text-3xl font-bold tracking-[-0.035em] sm:text-4xl">{copy.finalTitle}</h2>
            <p className="mt-3 leading-7 text-text-secondary">{copy.finalText}</p>
          </div>
          <a className="inline-flex justify-center rounded-2xl bg-accent px-6 py-4 font-bold text-white transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent-strong focus:ring-offset-2 focus:ring-offset-surface" href={playStoreHref}>
            {copy.playCta}
          </a>
        </section>

        <Footer language={language} />
      </div>
    </main>
  );
}
