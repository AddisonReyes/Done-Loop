import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, useColorScheme as useSystemColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { SettingsRepository } from '@/features/settings/repositories/settings-repository';
import type {
  UserAccentColorPreference,
  UserAppBackgroundPreference,
  UserThemePreference,
} from '@/features/settings/types';

type ResolvedTheme = 'light' | 'dark';

type ThemePreferenceContextValue = {
  preference: UserThemePreference;
  accentColor: UserAccentColorPreference;
  appBackground: UserAppBackgroundPreference;
  resolvedTheme: ResolvedTheme;
  isLoadingTheme: boolean;
  transitionOpacity: Animated.Value;
  transitionColor: string;
  setThemePreference: (preference: UserThemePreference) => Promise<void>;
  setAccentColorPreference: (accentColor: UserAccentColorPreference) => Promise<void>;
  setAppBackgroundPreference: (appBackground: UserAppBackgroundPreference) => Promise<void>;
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

function resolveTheme(preference: UserThemePreference, systemTheme: string | null | undefined): ResolvedTheme {
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }

  return systemTheme === 'dark' ? 'dark' : 'light';
}

export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const systemTheme = useSystemColorScheme();
  const [preference, setPreference] = useState<UserThemePreference>('system');
  const [accentColor, setAccentColor] = useState<UserAccentColorPreference>('purple');
  const [appBackground, setAppBackground] = useState<UserAppBackgroundPreference>('none');
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);
  const resolvedTheme = resolveTheme(preference, systemTheme);
  const previousResolvedTheme = useRef<ResolvedTheme>(resolvedTheme);
  const [transitionOpacity] = useState(() => new Animated.Value(0));
  const [transitionColor, setTransitionColor] = useState(Colors[resolvedTheme].background);

  useEffect(() => {
    let mounted = true;

    const loadPreference = async () => {
      const settings = await SettingsRepository.get();

      if (mounted) {
        setPreference(settings.theme);
        setAccentColor(settings.accentColor);
        setAppBackground(settings.appBackground);
        setIsLoadingTheme(false);
      }
    };

    void loadPreference();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (previousResolvedTheme.current === resolvedTheme) {
      return;
    }

    setTransitionColor(Colors[previousResolvedTheme.current].background);
    transitionOpacity.setValue(1);
    Animated.timing(transitionOpacity, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
    previousResolvedTheme.current = resolvedTheme;
  }, [resolvedTheme, transitionOpacity]);

  const setThemePreference = useCallback(async (nextPreference: UserThemePreference) => {
    const nextSettings = await SettingsRepository.update({ theme: nextPreference });
    setPreference(nextSettings.theme);
  }, []);

  const setAccentColorPreference = useCallback(async (nextAccentColor: UserAccentColorPreference) => {
    const nextSettings = await SettingsRepository.update({ accentColor: nextAccentColor });
    setAccentColor(nextSettings.accentColor);
  }, []);

  const setAppBackgroundPreference = useCallback(async (nextAppBackground: UserAppBackgroundPreference) => {
    const nextSettings = await SettingsRepository.update({ appBackground: nextAppBackground });
    setAppBackground(nextSettings.appBackground);
  }, []);

  const value = useMemo(
    () => ({
      preference,
      accentColor,
      appBackground,
      resolvedTheme,
      isLoadingTheme,
      transitionOpacity,
      transitionColor,
      setThemePreference,
      setAccentColorPreference,
      setAppBackgroundPreference,
    }),
    [
      accentColor,
      appBackground,
      isLoadingTheme,
      preference,
      resolvedTheme,
      setAppBackgroundPreference,
      setAccentColorPreference,
      setThemePreference,
      transitionColor,
      transitionOpacity,
    ]
  );

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference() {
  const value = useContext(ThemePreferenceContext);

  if (!value) {
    throw new Error('useThemePreference must be used inside ThemePreferenceProvider');
  }

  return value;
}
