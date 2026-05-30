import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#18181B',
    background: '#FAFAFF',
    backgroundElement: 'rgba(255, 255, 255, 0.88)',
    backgroundSelected: 'rgba(245, 243, 255, 0.92)',
    border: 'rgba(88, 28, 135, 0.12)',
    borderStrong: 'rgba(147, 51, 234, 0.26)',
    accent: '#8B5CF6',
    accentSoft: 'rgba(139, 92, 246, 0.14)',
    accentStrong: '#6D28D9',
    success: '#0284C7',
    warning: '#B45309',
    danger: '#E11D48',
    textSecondary: '#52525B',
    textMuted: '#71717A',
    surfaceSoft: 'rgba(255, 255, 255, 0.70)',
    surfaceStrong: 'rgba(255, 255, 255, 0.96)',
    glow: 'rgba(139, 92, 246, 0.18)',
    washTop: 'rgba(139, 92, 246, 0.16)',
    washMid: 'rgba(216, 180, 254, 0.10)',
    sheenStart: 'rgba(109, 40, 217, 0.06)',
    sheenEnd: 'rgba(255, 255, 255, 0.08)',
    historyEmpty: 'rgba(233, 213, 255, 0.52)',
    historyPartial: 'rgba(168, 85, 247, 0.34)',
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
    washTop: 'rgba(168, 85, 247, 0.20)',
    washMid: 'rgba(88, 28, 135, 0.08)',
    sheenStart: 'rgba(255, 255, 255, 0.07)',
    sheenEnd: 'rgba(255, 255, 255, 0.01)',
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
