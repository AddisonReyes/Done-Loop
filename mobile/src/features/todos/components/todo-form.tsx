import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import type { TodoPriority } from '@/features/todos/types';
import { isDateKey } from '@/shared/utils/date';

type TodoFormProps = {
  title: string;
  dueDate: string;
  priority: TodoPriority;
  onTitleChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onPriorityChange: (value: TodoPriority) => void;
  onSubmit: () => void;
};

const priorities: { value: TodoPriority; labelKey: string }[] = [
  { value: 1, labelKey: 'todos.priorities.1' },
  { value: 2, labelKey: 'todos.priorities.2' },
  { value: 3, labelKey: 'todos.priorities.3' },
];

export function TodoForm({
  title,
  dueDate,
  priority,
  onTitleChange,
  onDueDateChange,
  onPriorityChange,
  onSubmit,
}: TodoFormProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const disabled = title.trim().length === 0;
  const hasInvalidDueDate = dueDate.trim().length > 0 && !isDateKey(dueDate.trim());

  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel={t('todos.form.titleLabel')}
        placeholder={t('todos.form.titlePlaceholder')}
        placeholderTextColor={theme.textSecondary}
        value={title}
        onChangeText={onTitleChange}
        style={[
          styles.input,
          { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceStrong },
        ]}
      />
      {hasInvalidDueDate ? (
        <ThemedText type="small" themeColor="warning">
          {t('todos.form.invalidDate')}
        </ThemedText>
      ) : null}
      <TextInput
        accessibilityLabel={t('todos.form.dueDateLabel')}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={theme.textSecondary}
        value={dueDate}
        onChangeText={onDueDateChange}
        style={[
          styles.input,
          { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceStrong },
        ]}
      />
      <View style={styles.priorityRow}>
        {priorities.map((item) => {
          const selected = item.value === priority;
          return (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onPriorityChange(item.value)}
              style={[
                styles.priorityButton,
                {
                  backgroundColor: selected ? theme.accentSoft : theme.backgroundSelected,
                  borderColor: selected ? theme.borderStrong : theme.border,
                },
              ]}>
              <ThemedText type="smallBold" themeColor={selected ? 'accentStrong' : 'textSecondary'}>
                {t(item.labelKey)}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onSubmit}
        style={[
          styles.submit,
          {
            backgroundColor: disabled ? theme.backgroundSelected : theme.accent,
            borderColor: disabled ? theme.border : theme.borderStrong,
          },
        ]}>
        <ThemedText type="smallBold" style={styles.submitText}>
          {t('todos.form.create')}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  priorityButton: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  submit: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#FFFFFF',
  },
});
