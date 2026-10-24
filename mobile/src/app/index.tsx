import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";

import { SettingsRepository } from "@/features/settings/repositories/settings-repository";

export default function HomeScreen() {
  useFocusEffect(useCallback(() => {
    let isMounted = true;

    void SettingsRepository.get()
      .then((settings) => {
        if (isMounted) {
          router.navigate(settings.lastActiveRoute);
        }
      })
      .catch(() => {
        if (isMounted) {
          router.navigate("/habits");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []));

  return null;
}
