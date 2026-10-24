import { useIsFocused } from 'expo-router';
import { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { TodoEditorModal } from "@/features/todos/components/todo-editor-modal";
import { TodoListItem } from "@/features/todos/components/todo-list-item";
import type { TodoSort, TodoViewMode } from "@/features/todos/hooks/use-todos";
import { useTodos } from "@/features/todos/hooks/use-todos";
import type { Todo } from "@/features/todos/types";
import { useTranslation } from "@/i18n";
import { AnimatedListItem } from "@/shared/components/animated-list-item";
import { FloatingCreateButton } from "@/shared/components/floating-create-button";
import { SectionCard } from "@/shared/components/section-card";
import { SegmentedControl } from "@/shared/components/segmented-control";
import { VirtualizedScreenScaffold } from "@/shared/components/virtualized-screen-scaffold";
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

type TodoRow =
  | {
      type: "calendarHeading";
      dateKey: string;
    }
  | {
      type: "todo";
      animationIndex: number;
      todo: Todo;
    };

export default function TodosScreen() {
  const isFocused = useIsFocused();
  const { locale, t } = useTranslation();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const todos = useTodos({ isFocused });
  const { completeTodo, reopenTodo, deleteTodo, getTodoDateLabel, dateFormat } = todos;

  const confirmDeleteTodo = useCallback((todo: Todo) => {
    Alert.alert(t("todos.actions.delete"), todo.title, [
      { text: t("todos.actions.cancel"), style: "cancel" },
      {
        text: t("todos.actions.delete"),
        style: "destructive",
        onPress: () => {
          void deleteTodo(todo);
        },
      },
    ]);
  }, [t, deleteTodo]);

  const rows = useMemo<TodoRow[]>(() => {
    if (todos.viewMode === "calendar") {
      let animationIndex = 0;
      const calendarRows: TodoRow[] = [];

      for (const [dateKey, groupedTodos] of todos.calendarGroups) {
        calendarRows.push({ type: "calendarHeading", dateKey });
        for (const todo of groupedTodos) {
          calendarRows.push({ type: "todo", animationIndex, todo });
          animationIndex += 1;
        }
      }

      return calendarRows;
    }

    return todos.sortedTodos.map((todo, animationIndex) => ({
      type: "todo",
      animationIndex,
      todo,
    }));
  }, [todos.calendarGroups, todos.sortedTodos, todos.viewMode]);

  const listHeader = (
    <>
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
    </>
  );

  const renderRow = useCallback(
    ({ item }: { item: TodoRow }) => {
      if (item.type === "calendarHeading") {
        return (
          <View>
            <ThemedText type="smallBold" themeColor="accent">
              {isDateKey(item.dateKey)
                ? formatDateKey(item.dateKey, locale, dateFormat)
                : item.dateKey}
            </ThemedText>
          </View>
        );
      }

      return (
        <View>
          <AnimatedListItem
            animate={item.animationIndex < animatedListItemLimit}
            delay={item.animationIndex * 18}
          >
            <TodoListItem
              todo={item.todo}
              dateLabel={getTodoDateLabel(item.todo)}
              onComplete={() => void completeTodo(item.todo)}
              onReopen={() => void reopenTodo(item.todo)}
              onDelete={() => confirmDeleteTodo(item.todo)}
              onStartEdit={() => setEditingTodo(item.todo)}
            />
          </AnimatedListItem>
        </View>
      );
    },
    [confirmDeleteTodo, locale, dateFormat, getTodoDateLabel, completeTodo, reopenTodo],
  );

  return (
    <View style={styles.screen}>
      <VirtualizedScreenScaffold
        isFocused={isFocused}
        title={t("todos.title")}
        data={rows}
        keyExtractor={(item) =>
          item.type === "calendarHeading"
            ? `heading-${item.dateKey}`
            : `todo-${item.todo.id}`
        }
        listHeader={listHeader}
        emptyMessage={!todos.isLoading && !todos.errorMessage ? t("todos.empty") : undefined}
        renderItem={renderRow}
      />
      <TodoEditorModal
        dateFormat={dateFormat}
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSubmit={async (draft) => {
          if (await todos.createTodoFromDraft(draft)) {
            setIsCreateModalVisible(false);
          }
        }}
      />
      <TodoEditorModal
        dateFormat={dateFormat}
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
});
