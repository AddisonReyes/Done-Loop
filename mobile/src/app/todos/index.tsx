import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { TodoEditorModal } from "@/features/todos/components/todo-editor-modal";
import { TodoListItem } from "@/features/todos/components/todo-list-item";
import type { TodoSort, TodoViewMode } from "@/features/todos/hooks/use-todos";
import { useTodos } from "@/features/todos/hooks/use-todos";
import type { Todo } from "@/features/todos/types";
import { useTranslation } from "@/i18n";
import { AnimatedListItem } from "@/shared/components/animated-list-item";
import { EmptyState } from "@/shared/components/empty-state";
import { FloatingCreateButton } from "@/shared/components/floating-create-button";
import { ScreenScaffold } from "@/shared/components/screen-scaffold";
import { SectionCard } from "@/shared/components/section-card";
import { SegmentedControl } from "@/shared/components/segmented-control";
import { formatDateKey, isDateKey } from "@/shared/utils/date";

const sorts: { value: TodoSort; labelKey: string }[] = [
  { value: "priority", labelKey: "todos.sorts.priority" },
  { value: "dueAt", labelKey: "todos.sorts.dueAt" },
  { value: "createdAt", labelKey: "todos.sorts.createdAt" },
];

const modes: { value: TodoViewMode; labelKey: string }[] = [
  { value: "list", labelKey: "todos.modes.list" },
  { value: "calendar", labelKey: "todos.modes.calendar" },
];
const animatedListItemLimit = 24;

export default function TodosScreen() {
  const { locale, t } = useTranslation();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const todos = useTodos();

  const confirmDeleteTodo = (todo: Todo) => {
    Alert.alert(t("todos.actions.delete"), todo.title, [
      { text: t("todos.actions.cancel"), style: "cancel" },
      {
        text: t("todos.actions.delete"),
        style: "destructive",
        onPress: () => {
          void todos.deleteTodo(todo);
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScreenScaffold title={t("todos.title")}>
        <SectionCard>
          <SegmentedControl
            value={todos.viewMode}
            onChange={todos.setViewMode}
            options={modes.map((mode) => ({
              value: mode.value,
              label: t(mode.labelKey),
            }))}
          />
          <SegmentedControl
            value={todos.sort}
            onChange={todos.setSort}
            options={sorts.map((sort) => ({
              value: sort.value,
              label: t(sort.labelKey),
            }))}
          />
        </SectionCard>

        {todos.errorMessage ? (
          <ThemedText type="small" themeColor="warning">
            {todos.errorMessage}
          </ThemedText>
        ) : null}

        {todos.isLoading ? (
          <ThemedText type="small" themeColor="textSecondary">
            {t("todos.loading")}
          </ThemedText>
        ) : null}

        {todos.viewMode === "calendar" ? (
          <View style={styles.list}>
            {todos.calendarGroups.map(([dateKey, groupedTodos]) => (
              <View key={dateKey} style={styles.calendarGroup}>
                <ThemedText type="smallBold" themeColor="accent">
                  {isDateKey(dateKey)
                    ? formatDateKey(dateKey, locale, todos.dateFormat)
                    : dateKey}
                </ThemedText>
                {groupedTodos.map((todo, index) => (
                  <AnimatedListItem
                    key={todo.id}
                    animate={index < animatedListItemLimit}
                    delay={index * 18}
                  >
                    <TodoListItem
                      todo={todo}
                      dateLabel={todos.getTodoDateLabel(todo)}
                      onComplete={() => void todos.completeTodo(todo)}
                      onReopen={() => void todos.reopenTodo(todo)}
                      onDelete={() => confirmDeleteTodo(todo)}
                      onStartEdit={() => setEditingTodo(todo)}
                    />
                  </AnimatedListItem>
                ))}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.list}>
            {todos.sortedTodos.map((todo, index) => (
              <AnimatedListItem
                key={todo.id}
                animate={index < animatedListItemLimit}
                delay={index * 18}
              >
                <TodoListItem
                  todo={todo}
                  dateLabel={todos.getTodoDateLabel(todo)}
                  onComplete={() => void todos.completeTodo(todo)}
                  onReopen={() => void todos.reopenTodo(todo)}
                  onDelete={() => confirmDeleteTodo(todo)}
                  onStartEdit={() => setEditingTodo(todo)}
                />
              </AnimatedListItem>
            ))}
          </View>
        )}

        {!todos.isLoading && todos.sortedTodos.length === 0 ? (
          <EmptyState
            message={t("todos.empty")}
            actionLabel={t("todos.form.create")}
            onAction={() => setIsCreateModalVisible(true)}
          />
        ) : null}
      </ScreenScaffold>
      <TodoEditorModal
        dateFormat={todos.dateFormat}
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSubmit={async (draft) => {
          if (await todos.createTodoFromDraft(draft)) {
            setIsCreateModalVisible(false);
          }
        }}
      />
      <TodoEditorModal
        dateFormat={todos.dateFormat}
        todo={editingTodo}
        visible={!!editingTodo}
        onClose={() => setEditingTodo(null)}
        onSubmit={async (draft) => {
          if (
            editingTodo &&
            (await todos.updateTodoFromDraft(editingTodo, draft))
          ) {
            setEditingTodo(null);
          }
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
