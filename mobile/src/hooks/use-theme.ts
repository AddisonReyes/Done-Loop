import { AccentColors, Colors } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';

export function useTheme() {
  const { accentColor, resolvedTheme } = useThemePreference();

  return {
    ...Colors[resolvedTheme],
    ...AccentColors[resolvedTheme][accentColor],
  };
}
