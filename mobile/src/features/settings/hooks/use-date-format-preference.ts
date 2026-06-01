import { useEffect, useState } from 'react';

import { SettingsRepository } from '@/features/settings/repositories/settings-repository';
import type { UserDateFormatPreference } from '@/features/settings/types';

export function useDateFormatPreference(): UserDateFormatPreference {
  const [dateFormat, setDateFormat] = useState<UserDateFormatPreference>('dmy');

  useEffect(() => {
    let mounted = true;

    void SettingsRepository.get().then((settings) => {
      if (mounted) {
        setDateFormat(settings.dateFormat);
      }
    });

    const unsubscribe = SettingsRepository.subscribe((settings) => {
      setDateFormat(settings.dateFormat);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return dateFormat;
}
