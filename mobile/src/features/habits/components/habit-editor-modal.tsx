import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Habit, HabitRecurrenceType } from '@/features/habits/types';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import { AppModal } from '@/shared/components/app-modal';
import { TimePickerField } from '@/shared/components/time-picker-field';

type HabitDraft = {
  name: string;
  description: string;
  recurrenceType: HabitRecurrenceType;
  customIntervalDays: string;
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
    remindersEnabled: boolean;
    reminderTime?: string;
  }) => void;
};

const recurrenceTypes: HabitRecurrenceType[] = ['daily', 'weekly', 'monthly', 'custom'];

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
  const { t } = useTranslation();
  const [draft, setDraft] = useState<HabitDraft>({
    name: habit?.name ?? '',
    description: habit?.description ?? '',
    recurrenceType: habit?.recurrenceType ?? 'daily',
    customIntervalDays: habit?.customIntervalDays ? String(habit.customIntervalDays) : '',
    remindersEnabled: habit?.remindersEnabled ?? false,
    reminderTime: habit?.reminderTime,
  });
  const disabled = draft.name.trim().length === 0;

  return (
    <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          accessibilityLabel={t('habits.formLabel')}
          placeholder={t('habits.formPlaceholder')}
          placeholderTextColor={theme.textSecondary}
          value={draft.name}
          onChangeText={(name) => setDraft((current) => ({ ...current, name }))}
          style={[styles.input, { backgroundColor: theme.surfaceStrong, borderColor: theme.border, color: theme.text }]}
        />
        <TextInput
          accessibilityLabel={t('habits.descriptionLabel')}
          placeholder={t('habits.descriptionPlaceholder')}
          placeholderTextColor={theme.textSecondary}
          value={draft.description}
          onChangeText={(description) => setDraft((current) => ({ ...current, description }))}
          multiline
          style={[
            styles.input,
            styles.textArea,
            { backgroundColor: theme.surfaceStrong, borderColor: theme.border, color: theme.text },
          ]}
        />
        <ThemedText type="smallBold">{t('habits.recurrence')}</ThemedText>
        <View style={styles.segmentRow}>
          {recurrenceTypes.map((recurrenceType) => {
            const selected = recurrenceType === draft.recurrenceType;
            return (
              <Pressable
                key={recurrenceType}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setDraft((current) => ({ ...current, recurrenceType }))}
                style={[
                  styles.segment,
                  {
                    backgroundColor: selected ? theme.accentSoft : theme.backgroundSelected,
                    borderColor: selected ? theme.borderStrong : theme.border,
                  },
                ]}>
                <ThemedText type="smallBold" themeColor={selected ? 'accentStrong' : 'textSecondary'}>
                  {t(`habits.recurrences.${recurrenceType}`)}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
        {draft.recurrenceType === 'custom' ? (
          <TextInput
            accessibilityLabel={t('habits.customInterval')}
            placeholder="3"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            value={draft.customIntervalDays}
            onChangeText={(customIntervalDays) => setDraft((current) => ({ ...current, customIntervalDays }))}
            style={[styles.input, { backgroundColor: theme.surfaceStrong, borderColor: theme.border, color: theme.text }]}
          />
        ) : null}
        <View style={styles.switchRow}>
          <ThemedText type="smallBold">{t('habits.reminder')}</ThemedText>
          <Switch
            value={draft.remindersEnabled}
            onValueChange={(remindersEnabled) => setDraft((current) => ({ ...current, remindersEnabled }))}
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

const styles = StyleSheet.create({
  content: {
    gap: Spacing.two,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
  },
  textArea: {
    minHeight: 92,
    paddingTop: Spacing.two,
    textAlignVertical: 'top',
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  segment: {
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: Spacing.three,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
