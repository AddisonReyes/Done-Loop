import { useCallback, useEffect, useState } from 'react';

import { SettingsRepository } from '@/features/settings/repositories/settings-repository';
import { setNotificationsEnabledPreferenceAsync } from '@/features/settings/services/notification-settings';
import type {
  UserDateFormatPreference,
  UserAccentColorPreference,
  UserLanguagePreference,
  UserSettings,
  UserThemePreference,
} from '@/features/settings/types';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { useTranslation } from '@/i18n';

export function useSettings() {
  const { accentColor, preference, setAccentColorPreference, setThemePreference } = useThemePreference();
  const { language, setLanguage } = useTranslation();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setSettings(await SettingsRepository.get());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadSettings();
    }, 0);

    return () => clearTimeout(timeout);
  }, [loadSettings]);

  const setNotificationsEnabled = useCallback(
    async (enabled: boolean) => {
      setSettings(await setNotificationsEnabledPreferenceAsync(enabled, language));
    },
    [language]
  );

  const setTheme = useCallback(async (theme: UserThemePreference) => {
    await setThemePreference(theme);
  }, [setThemePreference]);

  const setAccentColor = useCallback(async (nextAccentColor: UserAccentColorPreference) => {
    await setAccentColorPreference(nextAccentColor);
  }, [setAccentColorPreference]);

  const setLanguagePreference = useCallback(async (nextLanguage: UserLanguagePreference) => {
    await setLanguage(nextLanguage);
  }, [setLanguage]);

  const setDateFormat = useCallback(async (dateFormat: UserDateFormatPreference) => {
    setSettings(await SettingsRepository.update({ dateFormat }));
  }, []);

  return {
    isLoading,
    settings: settings ? { ...settings, accentColor, theme: preference, language } : settings,
    setAccentColor,
    setDateFormat,
    setLanguage: setLanguagePreference,
    setNotificationsEnabled,
    setTheme,
  };
}
