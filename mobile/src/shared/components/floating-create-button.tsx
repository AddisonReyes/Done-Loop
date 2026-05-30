import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';

type FloatingCreateButtonProps = {
  onPress: () => void;
};

export function FloatingCreateButton({ onPress }: FloatingCreateButtonProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityLabel={t('common.create')}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.accent,
          borderColor: theme.borderStrong,
          bottom: insets.bottom + 96,
          shadowColor: theme.glow,
        },
        pressed && styles.pressed,
      ]}>
      <SymbolView
        name={{ ios: 'plus', android: 'add', web: 'add' }}
        tintColor="#FFFFFF"
        size={30}
        weight="bold"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 32,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    position: Platform.select({ web: 'fixed', default: 'absolute' }) as 'absolute',
    right: Spacing.three,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.26,
    shadowRadius: 28,
    width: 64,
    zIndex: 20,
    elevation: 12,
  },
  pressed: {
    opacity: 0.78,
  },
});
