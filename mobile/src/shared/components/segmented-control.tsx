import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/hooks/use-theme-preference';

type SegmentOption<T extends string> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ options, onChange, value }: SegmentedControlProps<T>) {
  const theme = useTheme();
  const { animationsEnabled } = useThemePreference();
  const [containerWidth, setContainerWidth] = useState(0);
  const hasOptions = options.length > 0;
  const wrapsOptions = options.length >= 4;
  const selectedIndex = Math.max(options.findIndex((option) => option.value === value), 0);
  const optionWidth = containerWidth > 0 && hasOptions ? (containerWidth - Spacing.half * 2) / options.length : 0;
  const indicatorX = useSharedValue(selectedIndex * optionWidth);
  const indicatorAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: optionWidth,
  }));

  useEffect(() => {
    const nextX = selectedIndex * optionWidth;

    if (!animationsEnabled) {
      indicatorX.value = nextX;
      return;
    }

    indicatorX.value = withTiming(nextX, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [animationsEnabled, indicatorX, optionWidth, selectedIndex]);

  return (
    <View
      testID="segmented-control"
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
      style={[
        styles.container,
        wrapsOptions && styles.wrappedContainer,
        { backgroundColor: theme.backgroundSelected, borderColor: theme.border },
      ]}>
      {containerWidth > 0 && hasOptions && !wrapsOptions ? (
        animationsEnabled ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              { backgroundColor: theme.backgroundElement },
              indicatorAnimatedStyle,
            ]}
          />
        ) : (
          <View
            pointerEvents="none"
            style={[
              styles.indicator,
              {
                backgroundColor: theme.backgroundElement,
                transform: [{ translateX: selectedIndex * optionWidth }],
                width: optionWidth,
              },
            ]}
          />
        )
      ) : null}
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.option,
              wrapsOptions && styles.wrappedOption,
              wrapsOptions &&
                selected && {
                  backgroundColor: theme.backgroundElement,
                },
            ]}>
            <ThemedText
              type="smallBold"
              themeColor={selected ? 'accentStrong' : 'textSecondary'}
              style={styles.optionLabel}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    padding: Spacing.half,
    position: 'relative',
  },
  wrappedContainer: {
    flexWrap: 'wrap',
    gap: Spacing.half,
  },
  indicator: {
    borderRadius: 13,
    bottom: Spacing.half,
    left: Spacing.half,
    position: 'absolute',
    top: Spacing.half,
  },
  option: {
    alignItems: 'center',
    borderRadius: 13,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: Spacing.two,
    zIndex: 1,
  },
  wrappedOption: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 112,
  },
  optionLabel: {
    minWidth: 0,
    textAlign: 'center',
  },
});
