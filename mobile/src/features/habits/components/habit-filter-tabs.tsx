import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { HabitFilter } from '../hooks/use-habits-mvp';

type HabitFilterTabsProps = {
  value: HabitFilter;
  onChange: (filter: HabitFilter) => void;
};

const filters: { value: HabitFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pendingToday', label: 'Pendientes' },
  { value: 'completedToday', label: 'Listos' },
];

export function HabitFilterTabs({ value, onChange }: HabitFilterTabsProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}>
      {filters.map((filter) => {
        const selected = filter.value === value;

        return (
          <Pressable
            key={filter.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(filter.value)}
            style={({ pressed }) => [
              styles.button,
              selected && { backgroundColor: theme.accentSoft, borderColor: theme.borderStrong },
              pressed && styles.pressed,
            ]}>
            <ThemedText
              type="smallBold"
              themeColor={selected ? 'accentStrong' : 'textSecondary'}
              style={styles.buttonLabel}>
              {filter.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    padding: Spacing.one,
    gap: Spacing.one,
  },
  button: {
    minHeight: 42,
    flex: 1,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  buttonLabel: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
});
