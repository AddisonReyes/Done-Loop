import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { UserDateFormatPreference } from '@/features/settings/types';
import type { Todo, TodoPriority } from '@/features/todos/types';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import { AppModal } from '@/shared/components/app-modal';
import { TextLimits } from '@/shared/constants/text-limits';
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
        <LimitedTextInput
          accessibilityLabel={t('todos.form.titleLabel')}
          placeholder={t('todos.form.titlePlaceholder')}
          value={title}
          limit={TextLimits.title}
          onChangeText={setTitle}
        />
        <LimitedTextInput
          accessibilityLabel={t('todos.form.descriptionLabel')}
          placeholder={t('todos.form.descriptionPlaceholder')}
          value={description}
          limit={TextLimits.description}
          onChangeText={setDescription}
          multiline
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
                <ThemedText
                  type="smallBold"
                  themeColor={selected ? 'accentStrong' : 'textSecondary'}
                  style={styles.optionText}>
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
  content: {
    gap: Spacing.two,
  },
  inputGroup: {
    gap: Spacing.one,
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
    gap: Spacing.two,
  },
  priorityButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: Spacing.two,
  },
  optionText: {
    textAlign: 'center',
  },
  counter: {
    alignSelf: 'flex-end',
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
