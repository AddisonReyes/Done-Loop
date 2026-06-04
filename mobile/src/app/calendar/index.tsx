import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { HabitMonthHistory } from "@/features/habits/components/habit-month-history";
import { useHabits } from "@/features/habits/hooks/use-habits";
import { getHabitRecurrenceDetail } from "@/features/habits/services/habit-recurrence-labels";
import type { Habit } from "@/features/habits/types";
import { TodoListItem } from "@/features/todos/components/todo-list-item";
import { useTodos } from "@/features/todos/hooks/use-todos";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/i18n";
import { ScreenScaffold } from "@/shared/components/screen-scaffold";
import { formatDateKey, isDateKey } from "@/shared/utils/date";

export default function CalendarScreen() {
  const { locale, t } = useTranslation();
  const theme = useTheme();
  const [selectedDateKey, setSelectedDateKey] = useState<string | undefined>();
  const habits = useHabits();
  const todos = useTodos();
  const monthDateKeys = new Set(habits.monthDateKeys);
  const monthlyTodoGroups = todos.calendarGroups.filter(([dateKey]) => {
    return isDateKey(dateKey) && monthDateKeys.has(dateKey);
  });
  const visibleTodoGroups = selectedDateKey
    ? monthlyTodoGroups.filter(([dateKey]) => dateKey === selectedDateKey)
    : monthlyTodoGroups;
  const selectedHabits = useMemo(
    () => (selectedDateKey ? habits.getHabitsForDate(selectedDateKey) : []),
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

  return (
    <ScreenScaffold title={t("calendar.title")}>
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
        {selectedDateKey ? (
          selectedHabits.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              {t("calendar.noHabitsForDay")}
            </ThemedText>
          ) : (
            <View style={styles.group}>
              {selectedHabits.map((habit) => (
                <CalendarHabitItem key={habit.id} habit={habit} />
              ))}
            </View>
          )
        ) : null}
      </View>

      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="accentStrong">
          {t("calendar.tasks")}
        </ThemedText>
        {visibleTodoGroups.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            {t(selectedDateKey ? "calendar.noTasksForDay" : "calendar.noTasks")}
          </ThemedText>
        ) : (
          visibleTodoGroups.map(([dateKey, groupedTodos]) => (
            <View key={dateKey} style={styles.group}>
              <ThemedText type="smallBold" themeColor="accent">
                {formatDateKey(dateKey, locale, todos.dateFormat)}
              </ThemedText>
              {groupedTodos.map((todo) => (
                <TodoListItem
                  key={todo.id}
                  todo={todo}
                  dateLabel={todos.getTodoDateLabel(todo)}
                  onComplete={() => void todos.completeTodo(todo)}
                  onReopen={() => void todos.reopenTodo(todo)}
                  onDelete={() => void todos.deleteTodo(todo)}
                />
              ))}
            </View>
          ))
        )}
      </View>
    </ScreenScaffold>
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
    minHeight: 40,
    paddingHorizontal: Spacing.three,
  },
  group: {
    gap: Spacing.two,
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
