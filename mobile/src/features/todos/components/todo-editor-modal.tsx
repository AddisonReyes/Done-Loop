import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { UserDateFormatPreference } from '@/features/settings/types';
import type { Todo, TodoPriority } from '@/features/todos/types';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import { AppModal } from '@/shared/components/app-modal';
import { DatePickerField } from '@/shared/components/date-picker-field';

type TodoEditorModalProps = {
  dateFormat: UserDateFormatPreference;
  todo?: Todo | null;
  visible: boolean;
  onClose: () => void;
  onSubmit: (draft: {
    title: string;
    description?: string;
    priority: TodoPriority;
    dueAt?: string;
  }) => void;
};

const priorities: TodoPriority[] = [1, 2, 3];

export function TodoEditorModal({ dateFormat, onClose, onSubmit, todo, visible }: TodoEditorModalProps) {
  const { t } = useTranslation();
  const modalKey = useMemo(() => `${todo?.id ?? 'new'}-${visible ? 'open' : 'closed'}`, [todo?.id, visible]);

  return (
    <AppModal title={todo ? t('todos.form.editTitle') : t('todos.form.createTitle')} visible={visible} onClose={onClose}>
      <TodoEditorForm key={modalKey} dateFormat={dateFormat} todo={todo} onSubmit={onSubmit} />
    </AppModal>
  );
}

function TodoEditorForm({
  dateFormat,
  onSubmit,
  todo,
}: Pick<TodoEditorModalProps, 'dateFormat' | 'onSubmit' | 'todo'>) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [title, setTitle] = useState(todo?.title ?? '');
  const [description, setDescription] = useState(todo?.description ?? '');
  const [priority, setPriority] = useState<TodoPriority>(todo?.priority ?? 2);
  const [dueAt, setDueAt] = useState<string | undefined>(todo?.dueAt);
  const disabled = title.trim().length === 0;

  return (
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          accessibilityLabel={t('todos.form.titleLabel')}
          placeholder={t('todos.form.titlePlaceholder')}
          placeholderTextColor={theme.textSecondary}
          value={title}
          onChangeText={setTitle}
          style={[styles.input, { backgroundColor: theme.surfaceStrong, borderColor: theme.border, color: theme.text }]}
        />
        <TextInput
          accessibilityLabel={t('todos.form.descriptionLabel')}
          placeholder={t('todos.form.descriptionPlaceholder')}
          placeholderTextColor={theme.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          style={[
            styles.input,
            styles.textArea,
            { backgroundColor: theme.surfaceStrong, borderColor: theme.border, color: theme.text },
          ]}
        />
        <View style={styles.priorityRow}>
          {priorities.map((item) => {
            const selected = item === priority;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setPriority(item)}
                style={[
                  styles.priorityButton,
                  {
                    backgroundColor: selected ? theme.accentSoft : theme.backgroundSelected,
                    borderColor: selected ? theme.borderStrong : theme.border,
                  },
                ]}>
                <ThemedText type="smallBold" themeColor={selected ? 'accentStrong' : 'textSecondary'}>
                  {t(`todos.priorities.${item}`)}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
        <DatePickerField
          dateFormat={dateFormat}
          label={t('todos.form.dueDateLabel')}
          value={dueAt}
          onChange={setDueAt}
        />
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={() =>
            onSubmit({
              title: title.trim(),
              description: description.trim() || undefined,
              priority,
              dueAt,
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
            {todo ? t('todos.actions.save') : t('todos.form.create')}
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
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  priorityButton: {
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: Spacing.three,
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
