"use client";

import Link from "next/link";
import { useState } from "react";

import { Footer } from "./footer";
import { LanguageSelect } from "./language-select";

const common = {
  en: {
    languageLabel: "Language",
    back: "Back to Done Loop",
    updated: "Last updated: May 31, 2026",
  },
  es: {
    languageLabel: "Idioma",
    back: "Volver a Done Loop",
    updated: "Última actualización: 31 de mayo de 2026",
  },
};

export function LegalPage({ content }) {
  const [language, setLanguage] = useState("en");
  const copy = content[language];
  const shared = common[language];

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="ambient-background" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col px-5 py-5 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between gap-4">
          <Link className="text-sm font-semibold text-accent-strong transition hover:text-foreground" href="/">
            {shared.back}
          </Link>
          <LanguageSelect language={language} label={shared.languageLabel} onChange={setLanguage} />
        </div>

        <article className="my-12 rounded-[2rem] border border-border bg-surface/86 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur md:p-10">
          <p className="text-sm font-semibold text-text-muted">{shared.updated}</p>
          <h1 className="mt-4 font-serif text-4xl font-bold tracking-[-0.035em] sm:text-5xl">{copy.title}</h1>
          <p className="mt-5 text-lg leading-8 text-text-secondary">{copy.intro}</p>
          <div className="mt-8 divide-y divide-border">
            {copy.sections.map((section) => (
              <section key={section.title} className="py-6 first:pt-0 last:pb-0">
                <h2 className="font-serif text-2xl font-semibold text-foreground">{section.title}</h2>
                <p className="mt-2 leading-7 text-text-secondary">{section.body}</p>
              </section>
            ))}
          </div>
        </article>

        <Footer language={language} />
      </div>
    </main>
  );
}
