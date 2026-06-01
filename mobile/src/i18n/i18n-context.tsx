import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { SettingsRepository } from '@/features/settings/repositories/settings-repository';
import type { UserLanguagePreference } from '@/features/settings/types';

import { translations } from './translations';

type TranslationParams = Record<string, string | number>;

type I18nContextValue = {
  language: UserLanguagePreference;
  locale: string;
  setLanguage: (language: UserLanguagePreference) => Promise<void>;
  t: (key: string, params?: TranslationParams) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function lookupTranslation(language: UserLanguagePreference, key: string): string {
  const segments = key.split('.');
  let value: unknown = translations[language];

  for (const segment of segments) {
    if (!value || typeof value !== 'object' || !(segment in value)) {
      return key;
    }

    value = (value as Record<string, unknown>)[segment];
  }

  return typeof value === 'string' ? value : key;
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(params[key] ?? ''));
}

export function I18nProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<UserLanguagePreference>('en');

  useEffect(() => {
    let mounted = true;

    const loadLanguage = async () => {
      const settings = await SettingsRepository.get();

      if (mounted) {
        setLanguageState(settings.language);
      }
    };

    void loadLanguage();

    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = useCallback(async (nextLanguage: UserLanguagePreference) => {
    const settings = await SettingsRepository.update({ language: nextLanguage });
    setLanguageState(settings.language);
  }, []);

  const t = useCallback(
    (key: string, params?: TranslationParams) => {
      return interpolate(lookupTranslation(language, key), params);
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      locale: language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const value = useContext(I18nContext);

  if (!value) {
    throw new Error('useTranslation must be used inside I18nProvider');
  }

  return value;
}
