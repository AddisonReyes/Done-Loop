import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

type HintRowProps = {
  title?: string;
  hint?: ReactNode;
};

export function HintRow({ title = 'Try editing', hint = 'app/index.tsx' }: HintRowProps) {
  return (
    <View style={styles.stepRow}>
      <ThemedText type="small" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedView type="backgroundSelected" style={styles.codeSnippet}>
        <ThemedText themeColor="textSecondary" style={styles.hintText}>
          {hint}
        </ThemedText>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  title: {
    flexShrink: 1,
    minWidth: 0,
  },
  codeSnippet: {
    borderRadius: Spacing.two,
    flexShrink: 1,
    minWidth: 0,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  hintText: {
    flexShrink: 1,
    minWidth: 0,
  },
});
