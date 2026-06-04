import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { useTranslation } from '@/i18n';

import { getHabitRecurrenceDetail } from '../services/habit-recurrence-labels';
import type { Habit } from '../types';

type HabitListItemProps = {
  habit: Habit;
  completedToday: boolean;
  completionDisabled?: boolean;
  statusLabel?: string;
  onToggleToday: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
};

export function HabitListItem({
  habit,
  completedToday,
  completionDisabled = false,
  statusLabel: statusLabelOverride,
  onToggleToday,
  onStartEdit,
  onDelete,
}: HabitListItemProps) {
  const theme = useTheme();
  const { animationsEnabled } = useThemePreference();
  const { t } = useTranslation();
  const statusLabel = statusLabelOverride ?? (completedToday ? t('habits.completedToday') : t('habits.pendingToday'));
  const recurrenceLabel = t(`habits.recurrences.${habit.recurrenceType}`);
  const recurrenceDetail = getHabitRecurrenceDetail(habit, t);
  const cardScale = useSharedValue(1);
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  useEffect(() => {
    if (!animationsEnabled) {
      cardScale.value = 1;
      return;
    }

    cardScale.value = withSequence(
      withTiming(0.985, { duration: 80 }),
      withSpring(1, { damping: 16, stiffness: 220 })
    );
  }, [animationsEnabled, cardScale, completedToday]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderColor: completedToday ? theme.borderStrong : theme.border,
          backgroundColor: completedToday ? theme.accentSoft : theme.backgroundElement,
        },
        animationsEnabled && cardAnimatedStyle,
      ]}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: completedToday, disabled: completionDisabled }}
            disabled={completionDisabled}
            onPress={onToggleToday}
            style={[
              styles.check,
              completionDisabled && styles.disabledCheck,
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
          {recurrenceDetail ? (
            <DetailRow label={recurrenceDetail.label} value={recurrenceDetail.value} />
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
    </Animated.View>
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
  const { animationsEnabled } = useThemePreference();
  const buttonScale = useSharedValue(1);
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));
  const setPressed = (pressed: boolean) => {
    if (!animationsEnabled) {
      buttonScale.value = 1;
      return;
    }

    buttonScale.value = withTiming(pressed ? 0.96 : 1, { duration: 100 });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}>
      <Animated.View
        style={[
          styles.iconButton,
          { backgroundColor: muted ? theme.backgroundSelected : theme.accentSoft },
          { borderColor: muted ? theme.border : theme.borderStrong },
          animationsEnabled && buttonAnimatedStyle,
        ]}>
        <MaterialCommunityIcons
          name={iconName}
          size={20}
          color={muted ? theme.textSecondary : theme.accentStrong}
        />
      </Animated.View>
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
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  titleGroup: {
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    minWidth: 128,
  },
  title: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  check: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'center',
  },
  checkText: {
    color: '#FFFFFF',
  },
  disabledCheck: {
    opacity: 0.48,
  },
  body: {
    gap: Spacing.two,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
  },
  actions: {
    flexDirection: 'row',
    flexShrink: 0,
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  iconButton: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  details: {
    gap: Spacing.one,
  },
  detailRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  detailLabel: {
    flex: 1,
    minWidth: 96,
  },
  detailValue: {
    flex: 1.4,
    flexShrink: 1,
    minWidth: 0,
    textAlign: 'right',
  },
  pressed: {
    opacity: 0.72,
  },
});
