import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { SettingsRepository } from '@/features/settings/repositories/settings-repository';
import type { UserDateFormatPreference } from '@/features/settings/types';
import { TodoEditorModal } from '@/features/todos/components/todo-editor-modal';
import { TodoListItem } from '@/features/todos/components/todo-list-item';
import { useTodosMvp } from '@/features/todos/hooks/use-todos-mvp';
import type { TodoSort, TodoViewMode } from '@/features/todos/hooks/use-todos-mvp';
import type { Todo } from '@/features/todos/types';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/i18n';
import { FloatingCreateButton } from '@/shared/components/floating-create-button';
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
  const [dateFormat, setDateFormat] = useState<UserDateFormatPreference>('iso');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const todos = useTodosMvp();

  useEffect(() => {
    const timeout = setTimeout(() => {
      SettingsRepository.get().then((settings) => setDateFormat(settings.dateFormat));
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.screen}>
      <ScreenScaffold
        eyebrow={t('todos.eyebrow')}
        title={t('todos.title')}
        description={t('todos.description')}>
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
                    editing={false}
                    editingTitle=""
                    dateLabel={todos.getTodoDateLabel(todo)}
                    onEditingTitleChange={() => {}}
                    onComplete={() => void todos.completeTodo(todo)}
                    onReopen={() => void todos.reopenTodo(todo)}
                    onSoftDelete={() => void todos.softDeleteTodo(todo)}
                    onRestore={() => void todos.restoreTodo(todo)}
                    onPermanentDelete={() => void todos.permanentlyDeleteTodo(todo)}
                    onStartEdit={() => setEditingTodo(todo)}
                    onSaveEdit={() => {}}
                    onCancelEdit={() => {}}
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
                editing={false}
                editingTitle=""
                dateLabel={todos.getTodoDateLabel(todo)}
                onEditingTitleChange={() => {}}
                onComplete={() => void todos.completeTodo(todo)}
                onReopen={() => void todos.reopenTodo(todo)}
                onSoftDelete={() => void todos.softDeleteTodo(todo)}
                onRestore={() => void todos.restoreTodo(todo)}
                onPermanentDelete={() => void todos.permanentlyDeleteTodo(todo)}
                onStartEdit={() => setEditingTodo(todo)}
                onSaveEdit={() => {}}
                onCancelEdit={() => {}}
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
  screen: {
    flex: 1,
  },
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
