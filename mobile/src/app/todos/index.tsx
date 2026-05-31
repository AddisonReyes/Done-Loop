import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { SettingsRepository } from '@/features/settings/repositories/settings-repository';
import type { UserDateFormatPreference } from '@/features/settings/types';
import { TodoEditorModal } from '@/features/todos/components/todo-editor-modal';
import { TodoListItem } from '@/features/todos/components/todo-list-item';
import { useTodos } from '@/features/todos/hooks/use-todos';
import type { TodoSort, TodoViewMode } from '@/features/todos/hooks/use-todos';
import type { Todo } from '@/features/todos/types';
import { Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { FloatingCreateButton } from '@/shared/components/floating-create-button';
import { EmptyState } from '@/shared/components/empty-state';
import { ScreenScaffold } from '@/shared/components/screen-scaffold';
import { SectionCard } from '@/shared/components/section-card';
import { SegmentedControl } from '@/shared/components/segmented-control';

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
  const { t } = useTranslation();
  const [dateFormat, setDateFormat] = useState<UserDateFormatPreference>('iso');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const todos = useTodos();

  useEffect(() => {
    const timeout = setTimeout(() => {
      SettingsRepository.get().then((settings) => setDateFormat(settings.dateFormat));
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.screen}>
      <ScreenScaffold title={t('todos.title')}>
        <SectionCard>
          <SegmentedControl
            value={todos.viewMode}
            onChange={todos.setViewMode}
            options={modes.map((mode) => ({ value: mode.value, label: t(mode.labelKey) }))}
          />
          <SegmentedControl
            value={todos.sort}
            onChange={todos.setSort}
            options={sorts.map((sort) => ({ value: sort.value, label: t(sort.labelKey) }))}
          />
        </SectionCard>

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

        {todos.viewMode === 'calendar' ? (
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
                    dateLabel={todos.getTodoDateLabel(todo)}
                    onComplete={() => void todos.completeTodo(todo)}
                    onReopen={() => void todos.reopenTodo(todo)}
                    onDelete={() => void todos.deleteTodo(todo)}
                    onStartEdit={() => setEditingTodo(todo)}
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
                dateLabel={todos.getTodoDateLabel(todo)}
                onComplete={() => void todos.completeTodo(todo)}
                onReopen={() => void todos.reopenTodo(todo)}
                onDelete={() => void todos.deleteTodo(todo)}
                onStartEdit={() => setEditingTodo(todo)}
              />
            ))}
          </View>
        )}

        {!todos.isLoading && todos.sortedTodos.length === 0 ? (
          <EmptyState
            message={t('todos.empty')}
            actionLabel={t('todos.form.create')}
            onAction={() => setIsCreateModalVisible(true)}
          />
        ) : null}
      </ScreenScaffold>
      <TodoEditorModal
        dateFormat={dateFormat}
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSubmit={(draft) => {
          void todos.createTodoFromDraft(draft);
          setIsCreateModalVisible(false);
        }}
      />
      <TodoEditorModal
        dateFormat={dateFormat}
        todo={editingTodo}
        visible={!!editingTodo}
        onClose={() => setEditingTodo(null)}
        onSubmit={(draft) => {
          if (editingTodo) {
            void todos.updateTodoFromDraft(editingTodo, draft);
          }
          setEditingTodo(null);
        }}
      />
      <FloatingCreateButton onPress={() => setIsCreateModalVisible(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    gap: Spacing.two,
  },
  calendarGroup: {
    gap: Spacing.two,
  },
});
