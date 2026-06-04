import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import type { Habit, HabitRecurrenceType } from '@/features/habits/types';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import { AppModal } from '@/shared/components/app-modal';
import { DatePickerField } from '@/shared/components/date-picker-field';
import { DropdownSelect } from '@/shared/components/dropdown-select';
import { TextLimits } from '@/shared/constants/text-limits';
import { TimePickerField } from '@/shared/components/time-picker-field';
import { formatMonthLabel, toDateKey } from '@/shared/utils/date';

type HabitDraft = {
  name: string;
  description: string;
  recurrenceType: HabitRecurrenceType;
  customIntervalDays: string;
  weeklyDays: number[];
  monthlyDays: number[];
  remindersEnabled: boolean;
  reminderTime?: string;
};

type HabitEditorModalProps = {
  habit?: Habit | null;
  visible: boolean;
  onClose: () => void;
  onSubmit: (draft: {
    name: string;
    description?: string;
    recurrenceType: HabitRecurrenceType;
    customIntervalDays?: number;
    weeklyDays?: number[];
    monthlyDays?: number[];
    remindersEnabled: boolean;
    reminderTime?: string;
  }) => void;
};

const recurrenceTypes: HabitRecurrenceType[] = ['daily', 'weekly', 'monthly', 'custom'];
const weeklyDays = [1, 2, 3, 4, 5, 6, 7] as const;
const maxMonthlyRecurrenceItems = 31;

function getIsoWeekday(date: Date): number {
  const weekday = date.getDay();
  return weekday === 0 ? 7 : weekday;
}

function getHabitCreatedDate(habit: Habit | null | undefined): Date | null {
  if (!habit) {
    return null;
  }

  const date = new Date(habit.createdAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDefaultWeeklyDays(habit: Habit | null | undefined, today: Date): number[] {
  if (habit?.weeklyDays?.length) {
    return habit.weeklyDays;
  }

  const createdDate = habit?.recurrenceType === 'weekly' ? getHabitCreatedDate(habit) : null;
  return [getIsoWeekday(createdDate ?? today)];
}

function getDefaultMonthlyDays(habit: Habit | null | undefined, today: Date): number[] {
  if (habit?.monthlyDays?.length) {
    return habit.monthlyDays;
  }

  const createdDate = habit?.recurrenceType === 'monthly' ? getHabitCreatedDate(habit) : null;
  return [(createdDate ?? today).getDate()];
}

function getMonthlySelectionMonth(habit: Habit | null | undefined, today: Date): Date {
  const createdDate = getHabitCreatedDate(habit);
  const date = createdDate ?? today;
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getLastDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getDateKeyForMonthDay(month: Date, day: number): string {
  const lastDay = getLastDayOfMonth(month);
  return toDateKey(new Date(month.getFullYear(), month.getMonth(), Math.min(day, lastDay)));
}

function getDayFromDateKey(dateKey: string): number {
  return Number(dateKey.slice(8, 10));
}

export function HabitEditorModal({ habit, onClose, onSubmit, visible }: HabitEditorModalProps) {
  const { t } = useTranslation();
  const modalKey = useMemo(() => `${habit?.id ?? 'new'}-${visible ? 'open' : 'closed'}`, [habit?.id, visible]);

  return (
    <AppModal
      title={habit ? t('habits.editTitle') : t('habits.createTitle')}
      visible={visible}
      onClose={onClose}>
      <HabitEditorForm key={modalKey} habit={habit} onSubmit={onSubmit} />
    </AppModal>
  );
}

function HabitEditorForm({ habit, onSubmit }: Pick<HabitEditorModalProps, 'habit' | 'onSubmit'>) {
  const theme = useTheme();
  const { locale, t } = useTranslation();
  const today = useMemo(() => new Date(), []);
  const monthlySelectionMonth = useMemo(() => getMonthlySelectionMonth(habit, today), [habit, today]);
  const monthlyMinimumDate = useMemo(
    () => new Date(monthlySelectionMonth.getFullYear(), monthlySelectionMonth.getMonth(), 1),
    [monthlySelectionMonth]
  );
  const monthlyMaximumDate = useMemo(
    () => new Date(monthlySelectionMonth.getFullYear(), monthlySelectionMonth.getMonth() + 1, 0),
    [monthlySelectionMonth]
  );
  const monthlySelectionMonthLabel = formatMonthLabel(monthlySelectionMonth, locale);
  const [draft, setDraft] = useState<HabitDraft>({
    name: habit?.name ?? '',
    description: habit?.description ?? '',
    recurrenceType: habit?.recurrenceType ?? 'daily',
    customIntervalDays: habit?.customIntervalDays ? String(habit.customIntervalDays) : '',
    weeklyDays: getDefaultWeeklyDays(habit, today),
    monthlyDays: getDefaultMonthlyDays(habit, today),
    remindersEnabled: habit?.remindersEnabled ?? false,
    reminderTime: habit?.reminderTime,
  });
  const disabled = draft.name.trim().length === 0;
  const monthlyLimitReached = draft.monthlyDays.length >= maxMonthlyRecurrenceItems;
  const recurrenceOptions = recurrenceTypes.map((recurrenceType) => ({
    value: recurrenceType,
    label: t(`habits.recurrences.${recurrenceType}`),
  }));

  const selectRecurrenceType = (recurrenceType: HabitRecurrenceType) => {
    setDraft((current) => {
      if (recurrenceType === 'weekly' && current.recurrenceType !== 'weekly') {
        return {
          ...current,
          recurrenceType,
          weeklyDays: current.weeklyDays.length > 0 ? current.weeklyDays : [getIsoWeekday(today)],
        };
      }

      if (recurrenceType === 'monthly' && current.recurrenceType !== 'monthly') {
        return {
          ...current,
          recurrenceType,
          monthlyDays: current.monthlyDays.length > 0 ? current.monthlyDays : [today.getDate()],
        };
      }

      return { ...current, recurrenceType };
    });
  };

  const toggleWeeklyDay = (day: number) => {
    setDraft((current) => {
      const selected = current.weeklyDays.includes(day);
      if (selected && current.weeklyDays.length === 1) {
        return current;
      }

      const nextWeeklyDays = selected
        ? current.weeklyDays.filter((selectedDay) => selectedDay !== day)
        : [...current.weeklyDays, day].sort((a, b) => a - b);

      if (nextWeeklyDays.length === weeklyDays.length) {
        return { ...current, recurrenceType: 'daily', weeklyDays: [] };
      }

      return { ...current, weeklyDays: nextWeeklyDays };
    });
  };

  const updateMonthlyDay = (index: number, dateKey: string | undefined) => {
    if (!dateKey) {
      return;
    }

    setDraft((current) => {
      const nextMonthlyDays = [...current.monthlyDays];
      nextMonthlyDays[index] = getDayFromDateKey(dateKey);

      if (new Set(nextMonthlyDays).size === getLastDayOfMonth(monthlySelectionMonth)) {
        return { ...current, recurrenceType: 'daily', monthlyDays: [] };
      }

      return { ...current, monthlyDays: nextMonthlyDays };
    });
  };

  const addMonthlyDay = () => {
    setDraft((current) => {
      if (current.monthlyDays.length >= maxMonthlyRecurrenceItems) {
        return current;
      }

      const nextDay = current.monthlyDays[current.monthlyDays.length - 1] ?? today.getDate();
      const nextMonthlyDays = [...current.monthlyDays, Math.min(nextDay, getLastDayOfMonth(monthlySelectionMonth))];
      return { ...current, monthlyDays: nextMonthlyDays };
    });
  };

  const removeMonthlyDay = (index: number) => {
    if (index === 0) {
      return;
    }

    setDraft((current) => {
      const nextMonthlyDays = current.monthlyDays.filter((_, currentIndex) => currentIndex !== index);
      return { ...current, monthlyDays: nextMonthlyDays.length > 0 ? nextMonthlyDays : current.monthlyDays };
    });
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      style={styles.scrollView}
      contentContainerStyle={styles.content}>
        <LimitedTextInput
          accessibilityLabel={t('habits.formLabel')}
          placeholder={t('habits.formPlaceholder')}
          value={draft.name}
          limit={TextLimits.title}
          onChangeText={(name) => setDraft((current) => ({ ...current, name }))}
        />
        <LimitedTextInput
          accessibilityLabel={t('habits.descriptionLabel')}
          placeholder={t('habits.descriptionPlaceholder')}
          value={draft.description}
          limit={TextLimits.description}
          onChangeText={(description) => setDraft((current) => ({ ...current, description }))}
          multiline
        />
        <ThemedText type="smallBold">{t('habits.recurrence')}</ThemedText>
        <DropdownSelect
          label={t('habits.recurrence')}
          value={draft.recurrenceType}
          onChange={selectRecurrenceType}
          options={recurrenceOptions}
        />
        {draft.recurrenceType === 'weekly' ? (
          <View style={styles.selectorGroup}>
            <ThemedText type="smallBold">{t('habits.weeklyDays')}</ThemedText>
            <View style={styles.dayRow}>
              {weeklyDays.map((day) => {
                const selected = draft.weeklyDays.includes(day);
                return (
                  <Pressable
                    key={day}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={t(`habits.weekdays.${day}`)}
                    onPress={() => toggleWeeklyDay(day)}
                    style={[
                      styles.dayChip,
                      {
                        backgroundColor: selected ? theme.accentSoft : theme.backgroundSelected,
                        borderColor: selected ? theme.borderStrong : theme.border,
                      },
                    ]}>
                    <ThemedText type="smallBold" themeColor={selected ? 'accentStrong' : 'textSecondary'}>
                      {t(`habits.weekdayShort.${day}`)}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
        {draft.recurrenceType === 'monthly' ? (
          <View style={styles.selectorGroup}>
            <View style={styles.monthlyHeader}>
              <View style={styles.monthlySummary}>
                <ThemedText type="smallBold">{t('habits.monthlyDays')}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {monthlySelectionMonthLabel}
                </ThemedText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('habits.addMonthlyDays')}
                accessibilityState={{ disabled: monthlyLimitReached }}
                disabled={monthlyLimitReached}
                onPress={addMonthlyDay}
                style={[
                  styles.addButton,
                  {
                    backgroundColor: theme.backgroundSelected,
                    borderColor: theme.border,
                    opacity: monthlyLimitReached ? 0.48 : 1,
                  },
                ]}>
                <ThemedText type="smallBold" themeColor="accentStrong">
                  +
                </ThemedText>
              </Pressable>
            </View>
            <View style={styles.monthlyList}>
              {draft.monthlyDays.map((day, index) => (
                <View key={`${index}-${day}`} style={styles.monthlyDateRow}>
                  <View style={styles.monthlyDateField}>
                    <DatePickerField
                      clearable={false}
                      dateFormat="long"
                      hideLabel
                      label={t('habits.monthlyDateLabel', { index: index + 1 })}
                      value={getDateKeyForMonthDay(monthlySelectionMonth, day)}
                      minimumDate={monthlyMinimumDate}
                      maximumDate={monthlyMaximumDate}
                      onChange={(dateKey) => updateMonthlyDay(index, dateKey)}
                    />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('habits.removeMonthlyDate', { index: index + 1 })}
                    disabled={index === 0}
                    onPress={() => removeMonthlyDay(index)}
                    style={[
                      styles.removeButton,
                      {
                        backgroundColor: index === 0 ? theme.backgroundSelected : theme.surfaceStrong,
                        borderColor: theme.border,
                        opacity: index === 0 ? 0.48 : 1,
                      },
                    ]}>
                    <ThemedText type="smallBold" themeColor="textSecondary">
                      -
                    </ThemedText>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        {draft.recurrenceType === 'custom' ? (
          <View
            style={[
              styles.intervalInputRow,
              { backgroundColor: theme.surfaceStrong, borderColor: theme.border },
            ]}>
            <TextInput
              accessibilityLabel={t('habits.customInterval')}
              placeholder="3"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              value={draft.customIntervalDays}
              onChangeText={(customIntervalDays) => setDraft((current) => ({ ...current, customIntervalDays }))}
              style={[styles.intervalInput, { color: theme.text }]}
            />
            <ThemedText type="smallBold" themeColor="textSecondary">
              {t('habits.customIntervalUnit')}
            </ThemedText>
          </View>
        ) : null}
        <View style={styles.switchRow}>
          <ThemedText type="smallBold">{t('habits.reminder')}</ThemedText>
          <Switch
            ios_backgroundColor={theme.backgroundSelected}
            thumbColor={draft.remindersEnabled ? theme.accent : theme.textMuted}
            trackColor={{ false: theme.backgroundSelected, true: theme.accentSoft }}
            value={draft.remindersEnabled}
            onValueChange={(remindersEnabled) => setDraft((current) => ({ ...current, remindersEnabled }))}
            style={styles.switchControl}
          />
        </View>
        {draft.remindersEnabled ? (
          <TimePickerField
            label={t('habits.reminderTime')}
            value={draft.reminderTime}
            onChange={(reminderTime) => setDraft((current) => ({ ...current, reminderTime }))}
          />
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={() =>
            onSubmit({
              name: draft.name.trim(),
              description: draft.description.trim() || undefined,
              recurrenceType: draft.recurrenceType,
              customIntervalDays:
                draft.recurrenceType === 'custom' ? Number(draft.customIntervalDays) || undefined : undefined,
              weeklyDays: draft.recurrenceType === 'weekly' ? draft.weeklyDays : undefined,
              monthlyDays: draft.recurrenceType === 'monthly' ? draft.monthlyDays : undefined,
              remindersEnabled: draft.remindersEnabled,
              reminderTime: draft.remindersEnabled ? draft.reminderTime : undefined,
            })
          }
          style={[
            styles.submit,
            {
              backgroundColor: disabled ? theme.backgroundSelected : theme.accent,
              borderColor: disabled ? theme.border : theme.borderStrong,
            },
          ]}>
          <ThemedText type="smallBold" style={styles.submitText}>
            {habit ? t('habits.save') : t('habits.create')}
          </ThemedText>
        </Pressable>
    </ScrollView>
  );
}

type LimitedTextInputProps = {
  accessibilityLabel: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
  limit: number;
};

function LimitedTextInput({
  accessibilityLabel,
  limit,
  multiline,
  onChangeText,
  placeholder,
  value,
}: LimitedTextInputProps) {
  const theme = useTheme();

  return (
    <View style={styles.inputGroup}>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        value={value}
        maxLength={limit}
        onChangeText={onChangeText}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.textArea,
          { backgroundColor: theme.surfaceStrong, borderColor: theme.border, color: theme.text },
        ]}
      />
      <ThemedText type="small" themeColor="textMuted" style={styles.counter}>
        {value.length}/{limit}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flexShrink: 1,
  },
  content: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    fontFamily: Fonts.sans,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
  },
  textArea: {
    minHeight: 92,
    paddingTop: Spacing.two,
    textAlignVertical: 'top',
  },
  selectorGroup: {
    gap: Spacing.one,
  },
  dayRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  dayChip: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 0,
    paddingHorizontal: Spacing.one,
  },
  monthlyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  monthlySummary: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  addButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  monthlyList: {
    gap: Spacing.one,
  },
  monthlyDateRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  monthlyDateField: {
    flex: 1,
    minWidth: 0,
  },
  removeButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    marginBottom: 0,
    width: 48,
  },
  intervalInputRow: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
  },
  intervalInput: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 16,
    minWidth: 0,
    paddingVertical: 0,
  },
  counter: {
    alignSelf: 'flex-end',
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  switchControl: {
    flexShrink: 0,
  },
  submit: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  submitText: {
    color: '#FFFFFF',
  },
});
