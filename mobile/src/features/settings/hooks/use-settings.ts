import { useCallback, useEffect, useState } from 'react';

import { NotificationService } from '@/features/notifications/services/notification-service';
import { SettingsRepository } from '@/features/settings/repositories/settings-repository';
import type {
  UserDateFormatPreference,
  UserLanguagePreference,
  UserSettings,
  UserThemePreference,
} from '@/features/settings/types';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { useTranslation } from '@/i18n';

export function useSettings() {
  const { preference, setThemePreference } = useThemePreference();
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
      const granted = enabled ? await NotificationService.requestPermissionsAsync() : false;
      setSettings(await SettingsRepository.update({ notificationsEnabled: enabled && granted }));
    },
    []
  );

  const setTheme = useCallback(async (theme: UserThemePreference) => {
    await setThemePreference(theme);
  }, [setThemePreference]);

  const setLanguagePreference = useCallback(async (nextLanguage: UserLanguagePreference) => {
    await setLanguage(nextLanguage);
  }, [setLanguage]);

  const setDateFormat = useCallback(async (dateFormat: UserDateFormatPreference) => {
    setSettings(await SettingsRepository.update({ dateFormat }));
  }, []);

  return {
    isLoading,
    settings: settings ? { ...settings, theme: preference, language } : settings,
    setDateFormat,
    setLanguage: setLanguagePreference,
    setNotificationsEnabled,
    setTheme,
  };
}
