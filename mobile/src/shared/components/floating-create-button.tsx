import { useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDecorativeAnimations } from '@/shared/hooks/use-decorative-animations';
import { useTranslation } from '@/i18n';

const bottomBarHeight = 52;

type FloatingCreateButtonProps = {
  accessibilityLabel?: string;
  onPress: () => void;
};

export function FloatingCreateButton({ accessibilityLabel, onPress }: FloatingCreateButtonProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const animationsEnabled = useDecorativeAnimations();
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => () => cancelAnimation(scale), [animationsEnabled, scale]);
  const setPressed = (pressed: boolean) => {
    if (!animationsEnabled) {
      scale.set(1);
      return;
    }

    scale.set(withTiming(pressed ? 0.96 : 1, { duration: 110 }));
  };

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? t('common.create')}
      accessibilityRole="button"
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.accent,
          borderColor: theme.borderStrong,
          bottom: insets.bottom + bottomBarHeight + Spacing.three,
          shadowColor: theme.glow,
        },
        pressed && styles.pressed,
      ]}>
      <Animated.View style={[styles.buttonContent, animationsEnabled && animatedStyle]}>
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 27,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    position: 'absolute',
    right: Spacing.three,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    width: 54,
    zIndex: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  buttonContent: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  pressed: {
    opacity: 0.78,
  },
});
