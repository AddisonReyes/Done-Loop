import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { TodoForm } from '@/features/todos/components/todo-form';
import { TodoListItem } from '@/features/todos/components/todo-list-item';
import { useTodosMvp } from '@/features/todos/hooks/use-todos-mvp';
import type { TodoSort, TodoViewMode } from '@/features/todos/hooks/use-todos-mvp';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import { ScreenScaffold } from '@/shared/components/screen-scaffold';

const sorts: { value: TodoSort; labelKey: string }[] = [
  { value: 'priority', labelKey: 'todos.sorts.priority' },
  { value: 'dueAt', labelKey: 'todos.sorts.dueAt' },
  { value: 'createdAt', labelKey: 'todos.sorts.createdAt' },
];

const modes: { value: TodoViewMode; labelKey: string }[] = [
  { value: 'list', labelKey: 'todos.modes.list' },
  { value: 'calendar', labelKey: 'todos.modes.calendar' },
];

export default function TodosScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const todos = useTodosMvp();

  return (
    <ScreenScaffold
      eyebrow={t('todos.eyebrow')}
      title={t('todos.title')}
      description={t('todos.description')}>
      <TodoForm
        title={todos.title}
        dueDate={todos.dueDate}
        priority={todos.priority}
        onTitleChange={todos.setTitle}
        onDueDateChange={todos.setDueDate}
        onPriorityChange={todos.setPriority}
        onSubmit={() => {
          void todos.createTodo();
        }}
      />

      <View style={styles.segmentRow}>
        {modes.map((mode) => (
          <Segment
            key={mode.value}
            label={t(mode.labelKey)}
            selected={todos.viewMode === mode.value}
            onPress={() => todos.setViewMode(mode.value)}
          />
        ))}
      </View>

      <View style={styles.segmentRow}>
        {sorts.map((sort) => (
          <Segment
            key={sort.value}
            label={t(sort.labelKey)}
            selected={todos.sort === sort.value}
            onPress={() => todos.setSort(sort.value)}
          />
        ))}
      </View>

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: todos.showDeleted }}
        onPress={() => todos.setShowDeleted(!todos.showDeleted)}
        style={[
          styles.deletedToggle,
          {
            backgroundColor: todos.showDeleted ? theme.accentSoft : theme.backgroundSelected,
            borderColor: todos.showDeleted ? theme.borderStrong : theme.border,
          },
        ]}>
        <ThemedText type="smallBold" themeColor={todos.showDeleted ? 'accentStrong' : 'textSecondary'}>
          {todos.showDeleted ? t('todos.deletedToggleActive') : t('todos.deletedToggle')}
        </ThemedText>
      </Pressable>

      {todos.errorMessage ? (
        <ThemedText type="small" themeColor="warning">
          {todos.errorMessage}
        </ThemedText>
      ) : null}

      {todos.isLoading ? (
        <ThemedText type="small" themeColor="textSecondary">
          {t('todos.loading')}
        </ThemedText>
      ) : null}

      {todos.viewMode === 'calendar' && !todos.showDeleted ? (
        <View style={styles.list}>
          {todos.calendarGroups.map(([dateKey, groupedTodos]) => (
            <View key={dateKey} style={styles.calendarGroup}>
              <ThemedText type="smallBold" themeColor="accent">
                {dateKey}
              </ThemedText>
              {groupedTodos.map((todo) => (
                <TodoListItem
                  key={todo.id}
                  todo={todo}
                  editing={todos.editingTodoId === todo.id}
                  editingTitle={todos.editingTitle}
                  dateLabel={todos.getTodoDateLabel(todo)}
                  onEditingTitleChange={todos.setEditingTitle}
                  onComplete={() => void todos.completeTodo(todo)}
                  onReopen={() => void todos.reopenTodo(todo)}
                  onSoftDelete={() => void todos.softDeleteTodo(todo)}
                  onRestore={() => void todos.restoreTodo(todo)}
                  onPermanentDelete={() => void todos.permanentlyDeleteTodo(todo)}
                  onStartEdit={() => todos.startEditing(todo)}
                  onSaveEdit={() => void todos.saveEditing()}
                  onCancelEdit={todos.cancelEditing}
                />
              ))}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.list}>
          {todos.sortedTodos.map((todo) => (
            <TodoListItem
              key={todo.id}
              todo={todo}
              editing={todos.editingTodoId === todo.id}
              editingTitle={todos.editingTitle}
              dateLabel={todos.getTodoDateLabel(todo)}
              onEditingTitleChange={todos.setEditingTitle}
              onComplete={() => void todos.completeTodo(todo)}
              onReopen={() => void todos.reopenTodo(todo)}
              onSoftDelete={() => void todos.softDeleteTodo(todo)}
              onRestore={() => void todos.restoreTodo(todo)}
              onPermanentDelete={() => void todos.permanentlyDeleteTodo(todo)}
              onStartEdit={() => todos.startEditing(todo)}
              onSaveEdit={() => void todos.saveEditing()}
              onCancelEdit={todos.cancelEditing}
            />
          ))}
        </View>
      )}

      {!todos.isLoading && todos.sortedTodos.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          {todos.showDeleted ? t('todos.emptyDeleted') : t('todos.empty')}
        </ThemedText>
      ) : null}
    </ScreenScaffold>
  );
}

function Segment({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.segment,
        {
          backgroundColor: selected ? theme.accentSoft : theme.backgroundSelected,
          borderColor: selected ? theme.borderStrong : theme.border,
        },
      ]}>
      <ThemedText type="smallBold" themeColor={selected ? 'accentStrong' : 'textSecondary'}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  segment: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  deletedToggle: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: Spacing.two,
  },
  calendarGroup: {
    gap: Spacing.two,
  },
});
