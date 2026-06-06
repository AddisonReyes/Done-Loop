import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { useEffect, useRef } from "react";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";
import { NotificationService } from "@/features/notifications/services/notification-service";
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
  const lastReminderSyncDateKeyRef = useRef(toDateKey(new Date()));
  const [fontsLoaded, fontError] = useFonts({
    "Fraunces-Bold": require("@/assets/fonts/Fraunces-Bold.ttf"),
    "Fraunces-Medium": require("@/assets/fonts/Fraunces-Medium.ttf"),
    "Fraunces-SemiBold": require("@/assets/fonts/Fraunces-SemiBold.ttf"),
  });

  useEffect(() => {
    void NotificationService.configureForegroundHandlingAsync();
    void NotificationService.configureResponseHandlingAsync();
    NotificationService.configureAppStateSync(() => {
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

  return (
    <ThemeProvider value={resolvedTheme === "dark" ? DarkTheme : DefaultTheme}>
      {!isLoadingTheme && animationsEnabled ? (
        <AnimatedSplashOverlay animationsEnabled={animationsEnabled} />
      ) : null}
      {fontsLoaded || fontError ? <AppTabs /> : null}
    </ThemeProvider>
  );
}
