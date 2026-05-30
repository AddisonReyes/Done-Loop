import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#F5F3FF',
    background: '#08080A',
    backgroundElement: 'rgba(24, 24, 27, 0.86)',
    backgroundSelected: 'rgba(39, 39, 42, 0.74)',
    border: 'rgba(255, 255, 255, 0.09)',
    borderStrong: 'rgba(192, 132, 252, 0.28)',
    accent: '#A855F7',
    accentSoft: 'rgba(168, 85, 247, 0.18)',
    accentStrong: '#C084FC',
    success: '#7DD3FC',
    warning: '#FBBF24',
    danger: '#FB7185',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    surfaceSoft: 'rgba(17, 17, 20, 0.72)',
    surfaceStrong: 'rgba(39, 39, 42, 0.92)',
    glow: 'rgba(168, 85, 247, 0.24)',
    historyEmpty: 'rgba(63, 63, 70, 0.52)',
    historyPartial: 'rgba(192, 132, 252, 0.56)',
    historyComplete: '#A855F7',
  },
  dark: {
    text: '#F5F3FF',
    background: '#08080A',
    backgroundElement: 'rgba(24, 24, 27, 0.86)',
    backgroundSelected: 'rgba(39, 39, 42, 0.74)',
    border: 'rgba(255, 255, 255, 0.09)',
    borderStrong: 'rgba(192, 132, 252, 0.28)',
    accent: '#A855F7',
    accentSoft: 'rgba(168, 85, 247, 0.18)',
    accentStrong: '#C084FC',
    success: '#7DD3FC',
    warning: '#FBBF24',
    danger: '#FB7185',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    surfaceSoft: 'rgba(17, 17, 20, 0.72)',
    surfaceStrong: 'rgba(39, 39, 42, 0.92)',
    glow: 'rgba(168, 85, 247, 0.24)',
    historyEmpty: 'rgba(63, 63, 70, 0.52)',
    historyPartial: 'rgba(192, 132, 252, 0.56)',
    historyComplete: '#A855F7',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 560;
