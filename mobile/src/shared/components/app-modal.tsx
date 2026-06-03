import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/hooks/use-theme-preference';

type AppModalProps = PropsWithChildren<{
  title: string;
  visible: boolean;
  onClose: () => void;
}>;

export function AppModal({ children, onClose, title, visible }: AppModalProps) {
  const theme = useTheme();
  const { animationsEnabled } = useThemePreference();
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType={animationsEnabled ? 'fade' : 'none'} transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.root}>
        <Animated.View entering={animationsEnabled ? FadeIn.duration(160) : undefined} style={styles.backdrop}>
          <Pressable accessibilityRole="button" style={styles.backdropPressable} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              paddingBottom: insets.bottom + Spacing.three,
              shadowColor: theme.glow,
            },
          ]}>
          <View style={styles.header}>
            <ThemedText type="smallBold" style={styles.title}>
              {title}
            </ThemedText>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                ×
              </ThemedText>
            </Pressable>
          </View>
          <View style={styles.body}>{children}</View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    alignSelf: 'center',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    gap: Spacing.three,
    maxHeight: '90%',
    maxWidth: 640,
    padding: Spacing.three,
    width: '100%',
    shadowOffset: { width: 0, height: -16 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  closeButton: {
    alignItems: 'center',
    flexShrink: 0,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  title: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  body: {
    flexShrink: 1,
  },
});
