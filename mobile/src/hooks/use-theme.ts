import { AccentColors, Colors } from '@/constants/theme';
import { useMemo } from 'react';
import { useThemePreference } from '@/hooks/use-theme-preference';

export function useTheme() {
  const { accentColor, resolvedTheme } = useThemePreference();

  return useMemo(() => ({
    ...Colors[resolvedTheme],
    ...AccentColors[resolvedTheme][accentColor],
  }), [accentColor, resolvedTheme]);
}
