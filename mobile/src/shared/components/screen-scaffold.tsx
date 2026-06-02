import { PropsWithChildren } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import type { UserAppBackgroundPreference } from '@/features/settings/types';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/hooks/use-theme-preference';

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

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <AppBackground preference={appBackground} resolvedTheme={resolvedTheme} />
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

function AppBackground({
  preference,
  resolvedTheme,
}: {
  preference: UserAppBackgroundPreference;
  resolvedTheme: 'light' | 'dark';
}) {
  const theme = useTheme();
  const { height, width } = useWindowDimensions();
  const gridLineColor = resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.075)' : 'rgba(0, 0, 0, 0.075)';

  if (preference === 'gradient') {
    return (
      <LinearGradient
        colors={[hexToRgba(theme.accent, 0.22), hexToRgba(theme.accent, 0.08), theme.background]}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        style={styles.backgroundLayer}
      />
    );
  }

  if (preference === 'grid') {
    const columns = Math.ceil(width / GridSize) + 1;
    const rows = Math.ceil(height / GridSize) + 1;

    return (
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <CircularGlow
          color={theme.accent}
          opacity={resolvedTheme === 'dark' ? 0.095 : 0.07}
          style={styles.topRightGlow}
        />
        <CircularGlow
          color={theme.accent}
          opacity={resolvedTheme === 'dark' ? 0.085 : 0.062}
          style={styles.bottomLeftGlow}
        />
        {Array.from({ length: columns }).map((_, index) => (
          <View
            key={`vertical-${index}`}
            style={[styles.gridVerticalLine, { backgroundColor: gridLineColor, left: index * GridSize }]}
          />
        ))}
        {Array.from({ length: rows }).map((_, index) => (
          <View
            key={`horizontal-${index}`}
            style={[styles.gridHorizontalLine, { backgroundColor: gridLineColor, top: index * GridSize }]}
          />
        ))}
      </View>
    );
  }

  return null;
}

function CircularGlow({
  color,
  opacity,
  style,
}: {
  color: string;
  opacity: number;
  style: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.glowRoot, style]}>
      {GlowRings.map((ring) => (
        <View
          key={ring.size}
          style={[
            styles.glowRing,
            {
              backgroundColor: hexToRgba(color, opacity * ring.opacity),
              borderRadius: ring.size / 2,
              height: ring.size,
              left: (GlowSize - ring.size) / 2,
              top: (GlowSize - ring.size) / 2,
              width: ring.size,
            },
          ]}
        />
      ))}
    </View>
  );
}

const GridSize = 32;
const GlowSize = 520;
const GlowRingCount = 32;
const GlowRings = Array.from({ length: GlowRingCount }, (_, index) => {
  const progress = index / (GlowRingCount - 1);

  return {
    opacity: 0.036 + progress * 0.032,
    size: GlowSize - progress * 460,
  };
});

function hexToRgba(hex: string, alpha: number) {
  const normalizedHex = hex.replace('#', '');
  const red = parseInt(normalizedHex.slice(0, 2), 16);
  const green = parseInt(normalizedHex.slice(2, 4), 16);
  const blue = parseInt(normalizedHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridVerticalLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
  },
  gridHorizontalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  glowRoot: {
    position: 'absolute',
    height: GlowSize,
    width: GlowSize,
  },
  glowRing: {
    position: 'absolute',
  },
  topRightGlow: {
    right: -230,
    top: -220,
  },
  bottomLeftGlow: {
    bottom: -230,
    left: -240,
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
