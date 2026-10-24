import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { useTranslation } from '@/i18n';

const bottomBarHeight = 52;

type FloatingCreateButtonProps = {
  accessibilityLabel?: string;
  onPress: () => void;
};

export function FloatingCreateButton({ accessibilityLabel, onPress }: FloatingCreateButtonProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { animationsEnabled } = useThemePreference();
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const setPressed = (pressed: boolean) => {
    if (!animationsEnabled) {
      scale.value = 1;
      return;
    }

    scale.value = withTiming(pressed ? 0.96 : 1, { duration: 110 });
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
