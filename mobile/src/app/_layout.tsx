import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router";
import { useFonts } from "expo-font";
import * as SystemUI from "expo-system-ui";
import { useEffect, useMemo, useRef } from "react";
import { AppState, View } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";
import { useTheme } from "@/hooks/use-theme";
import { NotificationService } from "@/features/notifications/services/notification-service";
import { invalidateHabitReads } from "@/features/habits/services/habit-reads";
import { SettingsRepository } from "@/features/settings/repositories/settings-repository";
import { reconcileExistingRemindersAsync } from "@/features/settings/services/notification-settings";
import {
  ThemePreferenceProvider,
  useThemePreference,
} from "@/hooks/use-theme-preference";
import { I18nProvider } from "@/i18n";
import { CurrentDateProvider } from "@/shared/hooks/use-current-date-key";
import { configureDefaultFonts } from "@/shared/utils/configure-default-fonts";
import { toDateKey } from "@/shared/utils/date";

configureDefaultFonts();

export default function TabLayout() {
  return (
    <ThemePreferenceProvider>
      <I18nProvider>
        <CurrentDateProvider>
          <ThemedNavigation />
        </CurrentDateProvider>
      </I18nProvider>
    </ThemePreferenceProvider>
  );
}

function ThemedNavigation() {
  const { animationsEnabled, isLoadingTheme, resolvedTheme } =
    useThemePreference();
  const theme = useTheme();
  const navigationTheme = useMemo(() => {
    const baseTheme = resolvedTheme === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        background: theme.background,
        card: theme.backgroundElement,
      },
    };
  }, [resolvedTheme, theme.background, theme.backgroundElement]);
  const lastReminderSyncDateKeyRef = useRef(toDateKey(new Date()));
  const [fontsLoaded, fontError] = useFonts({
    "Fraunces-Bold": require("@/assets/fonts/Fraunces-Bold.ttf"),
    "Fraunces-Medium": require("@/assets/fonts/Fraunces-Medium.ttf"),
    "Fraunces-SemiBold": require("@/assets/fonts/Fraunces-SemiBold.ttf"),
  });

  useEffect(() => {
    // Native screens can expose the root surface while swapping tab hierarchies.
    void SystemUI.setBackgroundColorAsync(theme.background).catch((error: unknown) => {
      console.warn('Could not update the native background color.', error);
    });
  }, [theme.background]);

  useEffect(() => {
    void NotificationService.configureForegroundHandlingAsync();
    void SettingsRepository.get().then((settings) =>
      NotificationService.refreshHabitNotificationActionsAsync(settings.language),
    ).catch((error: unknown) => console.error('Could not renew notification actions.', error));
    NotificationService.configureAppStateSync(() => {
      // A headless action can have committed while an earlier UI read was still pending.
      invalidateHabitReads();
      const currentDateKey = toDateKey(new Date());

      if (lastReminderSyncDateKeyRef.current === currentDateKey) {
        return;
      }

      lastReminderSyncDateKeyRef.current = currentDateKey;
      void SettingsRepository.get().then((settings) => {
        if (settings.notificationsEnabled) {
          return reconcileExistingRemindersAsync(settings.language).catch(
            () => undefined,
          );
        }
        return undefined;
      });
    });
  }, []);

  useEffect(() => {
    if (!(fontsLoaded || fontError) || isLoadingTheme) return;
    void NotificationService.configureResponseHandlingAsync();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void NotificationService.configureResponseHandlingAsync();
    });
    return () => subscription.remove();
  }, [fontError, fontsLoaded, isLoadingTheme]);

  return (
    <ThemeProvider value={navigationTheme}>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        {!isLoadingTheme && animationsEnabled ? (
          <AnimatedSplashOverlay animationsEnabled={animationsEnabled} />
        ) : null}
        {fontsLoaded || fontError ? <AppTabs /> : null}
      </View>
    </ThemeProvider>
  );
}
