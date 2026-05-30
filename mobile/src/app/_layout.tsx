import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Animated, StyleSheet } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { ThemePreferenceProvider, useThemePreference } from '@/hooks/use-theme-preference';
import { I18nProvider } from '@/i18n';

export default function TabLayout() {
  return (
    <ThemePreferenceProvider>
      <I18nProvider>
        <ThemedNavigation />
      </I18nProvider>
    </ThemePreferenceProvider>
  );
}

function ThemedNavigation() {
  const { resolvedTheme, transitionColor, transitionOpacity } = useThemePreference();

  return (
    <ThemeProvider value={resolvedTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.transitionOverlay,
          { backgroundColor: transitionColor, opacity: transitionOpacity },
        ]}
      />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  transitionOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
  },
});
