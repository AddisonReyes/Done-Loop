import { PropsWithChildren } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenScaffoldProps = PropsWithChildren<{
  title: string;
  eyebrow?: string;
  description?: string;
}>;

export function ScreenScaffold({ title, eyebrow, description, children }: ScreenScaffoldProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const hasSupportingText = !!eyebrow || !!description;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.washTop, theme.washMid, theme.background]}
        style={styles.topWash}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
            paddingLeft: Math.max(insets.left, Spacing.three),
            paddingRight: Math.max(insets.right, Spacing.three),
          },
        ]}>
        <View style={styles.inner}>
          <View style={[styles.header, !hasSupportingText && styles.compactHeader]}>
            {eyebrow ? (
              <ThemedText type="smallBold" themeColor="accentStrong" style={styles.eyebrow}>
                {eyebrow}
              </ThemedText>
            ) : null}
            <ThemedText type="title" style={styles.title}>
              {title}
            </ThemedText>
            {description ? (
              <ThemedText themeColor="textSecondary" style={styles.description}>
                {description}
              </ThemedText>
            ) : null}
          </View>

          <View style={styles.contentStack}>{children}</View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  topWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    pointerEvents: 'none',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.two,
  },
  compactHeader: {
    gap: 0,
  },
  eyebrow: {
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
  },
  description: {
    maxWidth: 420,
  },
  contentStack: {
    gap: Spacing.three,
  },
});
