import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#151716',
    background: '#F7F4EE',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E7F3EA',
    border: '#E3DED4',
    accent: '#287C57',
    accentSoft: '#DCEFE3',
    warning: '#B7791F',
    textSecondary: '#62665F',
  },
  dark: {
    text: '#F7F2E8',
    background: '#101412',
    backgroundElement: '#1A211D',
    backgroundSelected: '#22362B',
    border: '#2C372F',
    accent: '#7DD89D',
    accentSoft: '#183522',
    warning: '#E6B450',
    textSecondary: '#B9C0B6',
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
