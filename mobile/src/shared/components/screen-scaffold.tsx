import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenScaffoldProps = PropsWithChildren<{
  title: string;
  eyebrow?: string;
  description: string;
}>;

export function ScreenScaffold({ title, eyebrow, description, children }: ScreenScaffoldProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.washTop, theme.washMid, 'rgba(8, 8, 10, 0)']}
        locations={[0, 0.46, 1]}
        style={styles.topWash}
      />
      <LinearGradient
        colors={[theme.sheenStart, theme.sheenEnd, 'rgba(8, 8, 10, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.softSheen}
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
          <View style={styles.header}>
            {eyebrow ? (
              <ThemedText type="smallBold" themeColor="accentStrong" style={styles.eyebrow}>
                {eyebrow}
              </ThemedText>
            ) : null}
            <ThemedText type="title" style={styles.title}>
              {title}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.description}>
              {description}
            </ThemedText>
          </View>

          <ThemedView
            type="backgroundElement"
            style={[styles.card, { borderColor: theme.border, shadowColor: theme.glow }]}>
            <LinearGradient
              colors={[theme.sheenStart, theme.sheenEnd]}
              style={styles.cardSheen}
            />
            {children}
          </ThemedView>
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
    height: 360,
    pointerEvents: 'none',
  },
  softSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    opacity: 0.88,
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
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.two,
  },
  eyebrow: {
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 36,
    lineHeight: 42,
  },
  description: {
    maxWidth: 420,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: Spacing.three,
    gap: Spacing.three,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 34,
    elevation: 8,
  },
  cardSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    pointerEvents: 'none',
  },
});
