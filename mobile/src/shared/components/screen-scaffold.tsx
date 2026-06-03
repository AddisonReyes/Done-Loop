import { PropsWithChildren, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { AppBackground, type AppBackgroundSnapshot } from '@/shared/components/app-background';

type ScreenScaffoldProps = PropsWithChildren<{
  title: string;
  eyebrow?: string;
  description?: string;
}>;

export function ScreenScaffold({ title, eyebrow, description, children }: ScreenScaffoldProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { appBackground, resolvedTheme } = useThemePreference();
  const hasSupportingText = !!eyebrow || !!description;
  const currentBackground: AppBackgroundSnapshot = useMemo(
    () => ({
      accent: theme.accent,
      background: theme.background,
      preference: appBackground,
      resolvedTheme,
    }),
    [appBackground, resolvedTheme, theme.accent, theme.background]
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <AppBackground {...currentBackground} />
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
  scrollView: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
  },
  inner: {
    gap: Spacing.three,
    maxWidth: 720,
    minWidth: 0,
    width: '100%',
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
    minWidth: 0,
  },
  contentStack: {
    gap: Spacing.three,
  },
});
