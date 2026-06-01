import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
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
  const statusLabel = completedToday ? t('habits.completedToday') : t('habits.pendingToday');
  const recurrenceLabel = t(`habits.recurrences.${habit.recurrenceType}`);

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: completedToday ? theme.borderStrong : theme.border,
          backgroundColor: completedToday ? theme.accentSoft : theme.backgroundElement,
        },
      ]}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
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

          <ThemedText type="smallBold" style={[styles.title, completedToday && styles.completedTitle]}>
            {habit.name}
          </ThemedText>
        </View>

        <View style={styles.actions}>
          <IconAction iconName="pencil-outline" label={t('habits.edit')} onPress={onStartEdit} />
          <IconAction iconName="trash-can-outline" label={t('habits.delete')} muted onPress={onDelete} />
        </View>
      </View>

      <View style={styles.body}>
        {habit.description ? <ThemedText type="small">{habit.description}</ThemedText> : null}

        <View style={styles.details}>
          <DetailRow label={t('habits.detail.status')} value={statusLabel} />
          <DetailRow label={t('habits.detail.recurrence')} value={recurrenceLabel} />
          {habit.recurrenceType === 'custom' && habit.customIntervalDays ? (
            <DetailRow label={t('habits.detail.interval')} value={String(habit.customIntervalDays)} />
          ) : null}
          <DetailRow
            label={t('habits.detail.reminder')}
            value={habit.remindersEnabled ? t('common.on') : t('common.off')}
          />
          {habit.remindersEnabled && habit.reminderTime ? (
            <DetailRow label={t('habits.detail.reminderTime')} value={habit.reminderTime} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type IconActionProps = {
  iconName: IconName;
  label: string;
  muted?: boolean;
  onPress: () => void;
};

function IconAction({ iconName, label, muted, onPress }: IconActionProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: muted ? theme.backgroundSelected : theme.accentSoft },
        { borderColor: muted ? theme.border : theme.borderStrong },
        pressed && styles.pressed,
      ]}>
      <MaterialCommunityIcons
        name={iconName}
        size={20}
        color={muted ? theme.textSecondary : theme.accentStrong}
      />
    </Pressable>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.detailLabel}>
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={styles.detailValue}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  titleGroup: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
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
    gap: Spacing.two,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  iconButton: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  details: {
    gap: Spacing.one,
  },
  detailRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  detailLabel: {
    flex: 1,
  },
  detailValue: {
    flex: 1.4,
    textAlign: 'right',
  },
  pressed: {
    opacity: 0.72,
  },
});
