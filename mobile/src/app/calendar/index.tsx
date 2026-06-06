import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { HabitMonthHistory } from "@/features/habits/components/habit-month-history";
import { useHabits } from "@/features/habits/hooks/use-habits";
import { getHabitRecurrenceDetail } from "@/features/habits/services/habit-recurrence-labels";
import type { Habit } from "@/features/habits/types";
import { TodoListItem } from "@/features/todos/components/todo-list-item";
import { useTodos } from "@/features/todos/hooks/use-todos";
import type { Todo } from "@/features/todos/types";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/i18n";
import { VirtualizedScreenScaffold } from "@/shared/components/virtualized-screen-scaffold";
import { formatDateKey, isDateKey } from "@/shared/utils/date";

type CalendarRow =
  | {
      type: "habit";
      habit: Habit;
    }
  | {
      type: "message";
      id: string;
      text: string;
      themeColor?: "textSecondary" | "warning";
    }
  | {
      type: "sectionTitle";
      id: string;
      text: string;
    }
  | {
      type: "todo";
      todo: Todo;
    }
  | {
      type: "todoGroupTitle";
      dateKey: string;
    };

export default function CalendarScreen() {
  const { locale, t } = useTranslation();
  const theme = useTheme();
  const [selectedDateKey, setSelectedDateKey] = useState<string | undefined>();
  const habits = useHabits();
  const todos = useTodos();
  const monthDateKeys = useMemo(() => new Set(habits.monthDateKeys), [habits.monthDateKeys]);
  const monthlyTodoGroups = useMemo(
    () =>
      todos.calendarGroups.filter(([dateKey]) => {
        return isDateKey(dateKey) && monthDateKeys.has(dateKey);
      }),
    [monthDateKeys, todos.calendarGroups]
  );
  const visibleTodoGroups = useMemo(
    () =>
      selectedDateKey
        ? monthlyTodoGroups.filter(([dateKey]) => dateKey === selectedDateKey)
        : monthlyTodoGroups,
    [monthlyTodoGroups, selectedDateKey]
  );
  const isLoading = habits.isLoading || todos.isLoading;
  const errorMessage = habits.errorMessage ?? todos.errorMessage;
  const selectedHabits = useMemo(
    () =>
      selectedDateKey
        ? habits
            .getHabitsForDate(selectedDateKey)
            .filter((habit) => habit.recurrenceType !== "daily")
        : [],
    [habits, selectedDateKey],
  );
  const selectedDateLabel = selectedDateKey
    ? formatDateKey(selectedDateKey, locale, todos.dateFormat)
    : "";

  const handleSelectDate = useCallback((dateKey: string) => {
    setSelectedDateKey((current) =>
      current === dateKey ? undefined : dateKey,
    );
  }, []);

  const goToPreviousMonth = useCallback(() => {
    setSelectedDateKey(undefined);
    habits.goToPreviousMonth();
  }, [habits]);

  const goToNextMonth = useCallback(() => {
    setSelectedDateKey(undefined);
    habits.goToNextMonth();
  }, [habits]);

  const confirmDeleteTodo = useCallback(
    (todo: Todo) => {
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
    },
    [t, todos],
  );

  const rows = useMemo<CalendarRow[]>(() => {
    const nextRows: CalendarRow[] = [];

    if (selectedDateKey && !isLoading) {
      if (selectedHabits.length === 0) {
        nextRows.push({
          type: "message",
          id: "no-habits",
          text: t("calendar.noHabitsForDay"),
          themeColor: "textSecondary",
        });
      } else {
        for (const habit of selectedHabits) {
          nextRows.push({ type: "habit", habit });
        }
      }
    }

    nextRows.push({
      type: "sectionTitle",
      id: "tasks",
      text: t("calendar.tasks"),
    });

    if (errorMessage) {
      nextRows.push({
        type: "message",
        id: "tasks-error",
        text: errorMessage,
        themeColor: "warning",
      });
    }

    if (isLoading) {
      nextRows.push({
        type: "message",
        id: "tasks-loading",
        text: t("todos.loading"),
        themeColor: "textSecondary",
      });
      return nextRows;
    }

    if (visibleTodoGroups.length === 0) {
      nextRows.push({
        type: "message",
        id: "no-tasks",
        text: t(selectedDateKey ? "calendar.noTasksForDay" : "calendar.noTasks"),
        themeColor: "textSecondary",
      });
      return nextRows;
    }

    for (const [dateKey, groupedTodos] of visibleTodoGroups) {
      nextRows.push({ type: "todoGroupTitle", dateKey });
      for (const todo of groupedTodos) {
        nextRows.push({ type: "todo", todo });
      }
    }

    return nextRows;
  }, [errorMessage, isLoading, selectedDateKey, selectedHabits, t, visibleTodoGroups]);

  const listHeader = (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="accentStrong">
        {t("calendar.habits")}
      </ThemedText>
      <HabitMonthHistory
        monthLabel={habits.monthLabel}
        days={habits.monthHistoryDays}
        monthlyMarkedDateKeys={habits.monthlyHabitDateKeys}
        selectedDateKey={selectedDateKey}
        onSelectDate={handleSelectDate}
        onPreviousMonth={goToPreviousMonth}
        onNextMonth={goToNextMonth}
      />
      {selectedDateKey ? (
        <View
          style={[
            styles.selectedDayBar,
            { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
          ]}
        >
          <ThemedText
            type="smallBold"
            themeColor="accentStrong"
            style={styles.selectedDayText}
          >
            {t("calendar.selectedDay", { date: selectedDateLabel })}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("calendar.clearSelection")}
            onPress={() => setSelectedDateKey(undefined)}
            style={[
              styles.clearButton,
              {
                backgroundColor: theme.backgroundSelected,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText type="smallBold" themeColor="textSecondary">
              {t("common.clear")}
            </ThemedText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  const renderRow = useCallback(
    ({ item }: { item: CalendarRow }) => {
      if (item.type === "habit") {
        return (
          <View>
            <CalendarHabitItem habit={item.habit} />
          </View>
        );
      }

      if (item.type === "message") {
        return (
          <View>
            <ThemedText type="small" themeColor={item.themeColor ?? "textSecondary"}>
              {item.text}
            </ThemedText>
          </View>
        );
      }

      if (item.type === "sectionTitle") {
        return (
          <View>
            <ThemedText type="smallBold" themeColor="accentStrong">
              {item.text}
            </ThemedText>
          </View>
        );
      }

      if (item.type === "todoGroupTitle") {
        return (
          <View>
            <ThemedText type="smallBold" themeColor="accent">
              {formatDateKey(item.dateKey, locale, todos.dateFormat)}
            </ThemedText>
          </View>
        );
      }

      return (
        <View>
          <TodoListItem
            todo={item.todo}
            dateLabel={todos.getTodoDateLabel(item.todo)}
            onComplete={() => void todos.completeTodo(item.todo)}
            onReopen={() => void todos.reopenTodo(item.todo)}
            onDelete={() => confirmDeleteTodo(item.todo)}
          />
        </View>
      );
    },
    [confirmDeleteTodo, locale, todos]
  );

  return (
    <VirtualizedScreenScaffold
      title={t("calendar.title")}
      data={rows}
      keyExtractor={(item) => {
        if (item.type === "habit") {
          return `habit-${item.habit.id}`;
        }
        if (item.type === "todo") {
          return `todo-${item.todo.id}`;
        }
        if (item.type === "todoGroupTitle") {
          return `todo-group-${item.dateKey}`;
        }
        return `${item.type}-${item.id}`;
      }}
      listHeader={listHeader}
      renderItem={renderRow}
    />
  );
}

function CalendarHabitItem({ habit }: { habit: Habit }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const recurrenceDetail = getHabitRecurrenceDetail(habit, t);

  return (
    <View
      style={[
        styles.habitItem,
        { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
      ]}
    >
      <View style={styles.habitItemCopy}>
        <ThemedText type="smallBold">{habit.name}</ThemedText>
        {habit.description ? (
          <ThemedText type="small" themeColor="textSecondary">
            {habit.description}
          </ThemedText>
        ) : null}
      </View>
      <View style={styles.habitMeta}>
        <ThemedText
          type="smallBold"
          themeColor="accentStrong"
          style={styles.habitMetaText}
        >
          {t(`habits.recurrences.${habit.recurrenceType}`)}
        </ThemedText>
        {recurrenceDetail ? (
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.habitMetaText}
          >
            {recurrenceDetail.value}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  selectedDayBar: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    justifyContent: "space-between",
    minHeight: 64,
    padding: Spacing.three,
  },
  selectedDayText: {
    flex: 1,
    minWidth: 0,
  },
  clearButton: {
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  habitItem: {
    alignItems: "flex-start",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    justifyContent: "space-between",
    minHeight: 64,
    padding: Spacing.three,
  },
  habitItemCopy: {
    flex: 1,
    gap: Spacing.one,
    minWidth: 128,
  },
  habitMeta: {
    alignItems: "flex-end",
    gap: Spacing.one,
    minWidth: 88,
  },
  habitMetaText: {
    textAlign: "right",
  },
});
