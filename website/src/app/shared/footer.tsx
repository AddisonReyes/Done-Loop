import Link from "next/link";

import type { Language, Localized } from "./types";

const footerCopy = {
  en: {
    madeBy: "Made by",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
  },
  es: {
    madeBy: "Hecho por",
    privacy: "Política de Privacidad",
    terms: "Términos de Servicio",
  },
} satisfies Localized<{
  madeBy: string;
  privacy: string;
  terms: string;
}>;

type FooterProps = {
  language?: string;
};

function normalizeLanguage(language: string): Language {
  return language === "es" ? "es" : "en";
}

export function Footer({ language = "en" }: FooterProps) {
  const copy = footerCopy[normalizeLanguage(language)];

  return (
    <footer className="flex flex-col gap-4 border-t border-border py-8 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
      <p>
        {copy.madeBy}{" "}
        <a className="font-semibold text-accent-strong transition hover:text-foreground" href="https://addisonreyes.com" rel="noreferrer" target="_blank">
          Addison Reyes
        </a>
      </p>
      <nav className="flex flex-wrap gap-4" aria-label="Footer">
        <Link className="transition hover:text-foreground" href="/privacy">
          {copy.privacy}
        </Link>
        <Link className="transition hover:text-foreground" href="/terms">
          {copy.terms}
        </Link>
      </nav>
    </footer>
  );
}
