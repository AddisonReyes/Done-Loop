import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import type { Todo } from '@/features/todos/types';

type TodoListItemProps = {
  todo: Todo;
  dateLabel: string;
  onComplete: () => void;
  onReopen: () => void;
  onDelete: () => void;
  onStartEdit?: () => void;
};

const priorityLabelKeys = {
  1: 'todos.priorities.1',
  2: 'todos.priorities.2',
  3: 'todos.priorities.3',
} as const;

export function TodoListItem({
  todo,
  dateLabel,
  onComplete,
  onReopen,
  onDelete,
  onStartEdit,
}: TodoListItemProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const completed = todo.status === 'completed';
  const statusLabel = completed ? t('todos.status.completed') : t('todos.status.pending');

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: completed ? theme.borderStrong : theme.border,
          backgroundColor: completed ? theme.accentSoft : theme.backgroundElement,
        },
      ]}>
      <View style={styles.header}>
        <ThemedText type="smallBold" style={[styles.title, completed && styles.completedText]}>
          {todo.title}
        </ThemedText>

        <View style={styles.actions}>
          <IconAction
            iconName={completed ? 'refresh' : 'check-circle-outline'}
            label={completed ? t('todos.actions.reopen') : t('todos.actions.complete')}
            onPress={completed ? onReopen : onComplete}
          />
          {onStartEdit ? (
            <IconAction iconName="pencil-outline" label={t('todos.actions.edit')} muted onPress={onStartEdit} />
          ) : null}
          <IconAction iconName="trash-can-outline" label={t('todos.actions.delete')} muted onPress={onDelete} />
        </View>
      </View>

      {todo.description ? <ThemedText type="small">{todo.description}</ThemedText> : null}

      <View style={styles.details}>
        <DetailRow label={t('todos.detail.priority')} value={t(priorityLabelKeys[todo.priority])} />
        <DetailRow label={t('todos.detail.date')} value={dateLabel} />
        <DetailRow label={t('todos.detail.status')} value={statusLabel} />
      </View>
    </View>
  );
}

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

function IconAction({
  iconName,
  label,
  muted,
  onPress,
}: {
  iconName: IconName;
  label: string;
  muted?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: muted ? theme.backgroundSelected : theme.accentSoft,
          borderColor: muted ? theme.border : theme.borderStrong,
        },
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
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
  },
  completedText: {
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
