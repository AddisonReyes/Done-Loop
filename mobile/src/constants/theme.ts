import { Platform } from 'react-native';

import type { UserAccentColorPreference } from '@/features/settings/types';

export const Colors = {
  light: {
    text: '#18181B',
    background: '#F7F7FB',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F0EEF8',
    border: '#E4E4EA',
    borderStrong: '#D7C8F7',
    accent: '#8B5CF6',
    accentSoft: 'rgba(139, 92, 246, 0.14)',
    accentStrong: '#6D28D9',
    success: '#0284C7',
    warning: '#B45309',
    danger: '#E11D48',
    textSecondary: '#52525B',
    textMuted: '#71717A',
    surfaceSoft: '#FFFFFF',
    surfaceStrong: '#FFFFFF',
    glow: 'rgba(24, 24, 27, 0.08)',
    washTop: '#F7F7FB',
    washMid: '#F7F7FB',
    sheenStart: 'transparent',
    sheenEnd: 'transparent',
    historyEmpty: 'rgba(233, 213, 255, 0.52)',
    historyPartial: 'rgba(168, 85, 247, 0.34)',
    historyComplete: '#A855F7',
  },
  dark: {
    text: '#F5F3FF',
    background: '#0B0B0F',
    backgroundElement: '#17171D',
    backgroundSelected: '#22222A',
    border: '#2B2B34',
    borderStrong: '#4B3A68',
    accent: '#A855F7',
    accentSoft: 'rgba(168, 85, 247, 0.18)',
    accentStrong: '#C084FC',
    success: '#7DD3FC',
    warning: '#FBBF24',
    danger: '#FB7185',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    surfaceSoft: '#17171D',
    surfaceStrong: '#22222A',
    glow: 'rgba(0, 0, 0, 0.24)',
    washTop: '#0B0B0F',
    washMid: '#0B0B0F',
    sheenStart: 'transparent',
    sheenEnd: 'transparent',
    historyEmpty: 'rgba(63, 63, 70, 0.52)',
    historyPartial: 'rgba(192, 132, 252, 0.56)',
    historyComplete: '#A855F7',
  },
} as const;

type AccentThemeColors = Record<
  'accent' | 'accentSoft' | 'accentStrong' | 'borderStrong' | 'historyPartial' | 'historyComplete',
  string
>;

export const AccentColors: Record<'light' | 'dark', Record<UserAccentColorPreference, AccentThemeColors>> = {
  light: {
    purple: {
      accent: '#8B5CF6',
      accentSoft: 'rgba(139, 92, 246, 0.14)',
      accentStrong: '#6D28D9',
      borderStrong: '#D7C8F7',
      historyPartial: 'rgba(168, 85, 247, 0.34)',
      historyComplete: '#A855F7',
    },
    blue: {
      accent: '#2563EB',
      accentSoft: 'rgba(37, 99, 235, 0.14)',
      accentStrong: '#1D4ED8',
      borderStrong: '#BFDBFE',
      historyPartial: 'rgba(59, 130, 246, 0.34)',
      historyComplete: '#2563EB',
    },
    green: {
      accent: '#16A34A',
      accentSoft: 'rgba(22, 163, 74, 0.14)',
      accentStrong: '#15803D',
      borderStrong: '#BBF7D0',
      historyPartial: 'rgba(34, 197, 94, 0.32)',
      historyComplete: '#16A34A',
    },
    red: {
      accent: '#DC2626',
      accentSoft: 'rgba(220, 38, 38, 0.12)',
      accentStrong: '#B91C1C',
      borderStrong: '#FECACA',
      historyPartial: 'rgba(248, 113, 113, 0.32)',
      historyComplete: '#DC2626',
    },
    yellow: {
      accent: '#D97706',
      accentSoft: 'rgba(217, 119, 6, 0.15)',
      accentStrong: '#92400E',
      borderStrong: '#FDE68A',
      historyPartial: 'rgba(245, 158, 11, 0.34)',
      historyComplete: '#D97706',
    },
    pink: {
      accent: '#DB2777',
      accentSoft: 'rgba(219, 39, 119, 0.13)',
      accentStrong: '#BE185D',
      borderStrong: '#FBCFE8',
      historyPartial: 'rgba(236, 72, 153, 0.32)',
      historyComplete: '#DB2777',
    },
  },
  dark: {
    purple: {
      accent: '#A855F7',
      accentSoft: 'rgba(168, 85, 247, 0.18)',
      accentStrong: '#C084FC',
      borderStrong: '#4B3A68',
      historyPartial: 'rgba(192, 132, 252, 0.56)',
      historyComplete: '#A855F7',
    },
    blue: {
      accent: '#60A5FA',
      accentSoft: 'rgba(96, 165, 250, 0.18)',
      accentStrong: '#93C5FD',
      borderStrong: '#1E3A5F',
      historyPartial: 'rgba(96, 165, 250, 0.52)',
      historyComplete: '#60A5FA',
    },
    green: {
      accent: '#4ADE80',
      accentSoft: 'rgba(74, 222, 128, 0.16)',
      accentStrong: '#86EFAC',
      borderStrong: '#1F5132',
      historyPartial: 'rgba(74, 222, 128, 0.48)',
      historyComplete: '#4ADE80',
    },
    red: {
      accent: '#F87171',
      accentSoft: 'rgba(248, 113, 113, 0.16)',
      accentStrong: '#FCA5A5',
      borderStrong: '#5F2A32',
      historyPartial: 'rgba(248, 113, 113, 0.48)',
      historyComplete: '#F87171',
    },
    yellow: {
      accent: '#FBBF24',
      accentSoft: 'rgba(251, 191, 36, 0.16)',
      accentStrong: '#FCD34D',
      borderStrong: '#5C481A',
      historyPartial: 'rgba(251, 191, 36, 0.48)',
      historyComplete: '#FBBF24',
    },
    pink: {
      accent: '#F472B6',
      accentSoft: 'rgba(244, 114, 182, 0.16)',
      accentStrong: '#F9A8D4',
      borderStrong: '#5E2949',
      historyPartial: 'rgba(244, 114, 182, 0.48)',
      historyComplete: '#F472B6',
    },
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
