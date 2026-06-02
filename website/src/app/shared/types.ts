export type Language = "en" | "es";

export type Localized<T> = Record<Language, T>;

export type LegalSection = {
  title: string;
  body: string;
};

export type LegalContent = {
  title: string;
  intro: string;
  sections: LegalSection[];
};

export function isLanguage(value: string): value is Language {
  return value === "en" || value === "es";
}
