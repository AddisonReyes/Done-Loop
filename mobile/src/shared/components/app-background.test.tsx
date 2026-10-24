import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import type { ComponentProps } from 'react';
import * as ReactNative from 'react-native';
import { StyleSheet, View as MockView } from 'react-native';

import { AccentColors, Colors } from '@/constants/theme';
import type { UserAccentColorPreference, UserAppBackgroundPreference } from '@/features/settings/types';

import { AppBackground } from './app-background';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: (props: ComponentProps<typeof MockView>) => <MockView {...props} testID="gradient-layer" />,
}));

const themes = ['light', 'dark'] as const;
const preferences: UserAppBackgroundPreference[] = ['none', 'gradient', 'grid', 'solar'];
const accents: UserAccentColorPreference[] = ['purple', 'blue', 'green', 'red', 'yellow', 'pink'];
const dimensions = [
  { width: 320, height: 568, scale: 1, fontScale: 1 },
  { width: 432, height: 960, scale: 2.5, fontScale: 1.5 },
  { width: 960, height: 432, scale: 3, fontScale: 1 },
];

describe('AppBackground', () => {
  let windowDimensions: jest.SpiedFunction<typeof ReactNative.useWindowDimensions>;

  beforeEach(() => {
    const native = jest.requireActual<typeof import('react-native')>('react-native');
    windowDimensions = jest.spyOn(native, 'useWindowDimensions').mockReturnValue(dimensions[0]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each(themes.flatMap((theme) => preferences.map((preference) => ({ theme, preference }))))(
    'covers the parent without intercepting touches for $preference in $theme',
    async ({ theme, preference }) => {
      const rendered = await render(
        <AppBackground
          accent={AccentColors[theme].purple.accent}
          background={Colors[theme].background}
          preference={preference}
          resolvedTheme={theme}
        />
      );

      const layer = rendered.toJSON();
      expect(layer?.props.pointerEvents).toBe('none');
      expect(StyleSheet.flatten(layer?.props.style)).toMatchObject({
        position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
      });
    },
  );

  it.each(themes.flatMap((theme) => accents.map((accent) => ({ theme, accent }))))(
    'updates the gradient when the theme or accent changes to $theme/$accent',
    async ({ theme, accent }) => {
      const rendered = await render(
        <AppBackground accent="#000000" background="#000000" preference="none" resolvedTheme="dark" />
      );
      await rendered.rerender(
        <AppBackground
          accent={AccentColors[theme][accent].accent}
          background={Colors[theme].background}
          preference="gradient"
          resolvedTheme={theme}
        />
      );

      const colors: string[] = screen.getByTestId('gradient-layer').props.colors;
      expect(colors).toHaveLength(3);
      expect(ReactNative.processColor(colors[0])).toBe(ReactNative.processColor(`${AccentColors[theme][accent].accent}38`));
      expect(ReactNative.processColor(colors[1])).toBe(ReactNative.processColor(`${AccentColors[theme][accent].accent}14`));
      expect(colors[2]).toBe(Colors[theme].background);
    },
  );

  it.each(themes.flatMap((theme) => dimensions.map((size) => ({ theme, ...size }))))(
    'draws both grid axes across $width x $height in $theme',
    async ({ theme, width, height, scale, fontScale }) => {
      windowDimensions.mockReturnValue({ width, height, scale, fontScale });
      const rendered = await render(
        <AppBackground
          accent={AccentColors[theme].purple.accent}
          background={Colors[theme].background}
          preference="grid"
          resolvedTheme={theme}
        />
      );

      const vertical = rendered.root?.queryAll((node) => {
        const style = StyleSheet.flatten(node.props.style);
        return style?.width === StyleSheet.hairlineWidth && style.top === 0 && style.bottom === 0;
      }) ?? [];
      const horizontal = rendered.root?.queryAll((node) => {
        const style = StyleSheet.flatten(node.props.style);
        return style?.height === StyleSheet.hairlineWidth && style.left === 0 && style.right === 0;
      }) ?? [];

      expect(vertical).toHaveLength(Math.ceil(width / 40) + 1);
      expect(horizontal).toHaveLength(Math.ceil(height / 40) + 1);
      expect(StyleSheet.flatten(vertical[0].props.style).left).toBe(0);
      expect(StyleSheet.flatten(vertical[vertical.length - 1].props.style).left).toBeGreaterThanOrEqual(width);
      expect(StyleSheet.flatten(horizontal[0].props.style).top).toBe(0);
      expect(StyleSheet.flatten(horizontal[horizontal.length - 1].props.style).top).toBeGreaterThanOrEqual(height);
      expect(StyleSheet.flatten(vertical[0].props.style).backgroundColor)
        .toBe(StyleSheet.flatten(horizontal[0].props.style).backgroundColor);
    },
  );
});
