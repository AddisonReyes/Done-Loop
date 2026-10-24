import { createContext, useContext } from 'react';

import { useThemePreference } from '@/hooks/use-theme-preference';
import { useAppActive } from './use-app-active';

export const ScreenActivityContext = createContext(true);

export function useDecorativeAnimations(): boolean {
  const { animationsEnabled } = useThemePreference();
  const screenActive = useContext(ScreenActivityContext);
  const appActive = useAppActive();
  return animationsEnabled && screenActive && appActive;
}
