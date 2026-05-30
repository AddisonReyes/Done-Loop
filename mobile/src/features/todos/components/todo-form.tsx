import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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

const priorities: { value: TodoPriority; label: string }[] = [
  { value: 1, label: 'Importante' },
  { value: 2, label: 'Relevante' },
  { value: 3, label: 'Simple' },
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
  const disabled = title.trim().length === 0;
  const hasInvalidDueDate = dueDate.trim().length > 0 && !isDateKey(dueDate.trim());

  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="Titulo de la tarea"
        placeholder="Nueva tarea"
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
          Usa el formato YYYY-MM-DD.
        </ThemedText>
      ) : null}
      <TextInput
        accessibilityLabel="Fecha limite"
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
                {item.label}
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
          Crear tarea
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
