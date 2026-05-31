import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';

import type { Habit } from '../types';

type HabitListItemProps = {
  habit: Habit;
  completedToday: boolean;
  onToggleToday: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
};

export function HabitListItem({
  habit,
  completedToday,
  onToggleToday,
  onStartEdit,
  onDelete,
}: HabitListItemProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: completedToday ? theme.borderStrong : theme.border,
          backgroundColor: completedToday ? theme.accentSoft : theme.backgroundElement,
        },
      ]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completedToday }}
        onPress={onToggleToday}
        style={[
          styles.check,
            {
                borderColor: completedToday ? theme.accentStrong : theme.border,
                backgroundColor: completedToday ? theme.accent : theme.backgroundSelected,
              },
        ]}>
        <ThemedText type="smallBold" style={completedToday && styles.checkText}>
          {completedToday ? '✓' : ''}
        </ThemedText>
      </Pressable>

      <View style={styles.body}>
        <ThemedText type="smallBold" style={completedToday && styles.completedTitle}>
          {habit.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {completedToday ? t('habits.completedToday') : t('habits.pendingToday')}
        </ThemedText>

        <View style={styles.actions}>
          <ActionButton label={t('habits.edit')} onPress={onStartEdit} />
          <ActionButton label={t('habits.delete')} onPress={onDelete} muted />
        </View>
      </View>
    </View>
  );
}

type ActionButtonProps = {
  label: string;
  muted?: boolean;
  onPress: () => void;
};

function ActionButton({ label, muted, onPress }: ActionButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: muted ? theme.backgroundSelected : theme.accentSoft },
        { borderColor: muted ? theme.border : theme.borderStrong },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="smallBold" themeColor={muted ? 'textSecondary' : 'accentStrong'}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.three,
    flexDirection: 'row',
    gap: Spacing.three,
  },
  check: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#FFFFFF',
  },
  body: {
    flex: 1,
    gap: Spacing.two,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actionButton: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  pressed: {
    opacity: 0.72,
  },
});
