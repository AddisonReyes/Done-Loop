import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Animated, StyleSheet } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { ThemePreferenceProvider, useThemePreference } from '@/hooks/use-theme-preference';
import { I18nProvider } from '@/i18n';
import { configureDefaultFonts } from '@/shared/utils/configure-default-fonts';

configureDefaultFonts();

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
  const [fontsLoaded] = useFonts({
    'Fraunces-Bold': require('@/assets/fonts/Fraunces-Bold.ttf'),
    'Fraunces-Medium': require('@/assets/fonts/Fraunces-Medium.ttf'),
    'Fraunces-SemiBold': require('@/assets/fonts/Fraunces-SemiBold.ttf'),
  });

  return (
    <ThemeProvider value={resolvedTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {fontsLoaded ? <AppTabs /> : null}
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
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
});
