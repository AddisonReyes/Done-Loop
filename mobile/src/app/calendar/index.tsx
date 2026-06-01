import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { HabitMonthHistory } from '@/features/habits/components/habit-month-history';
import { useHabits } from '@/features/habits/hooks/use-habits';
import { TodoListItem } from '@/features/todos/components/todo-list-item';
import { useTodos } from '@/features/todos/hooks/use-todos';
import { Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { ScreenScaffold } from '@/shared/components/screen-scaffold';
import { formatDateKey, isDateKey } from '@/shared/utils/date';

export default function CalendarScreen() {
  const { locale, t } = useTranslation();
  const habits = useHabits();
  const todos = useTodos();
  const monthDateKeys = new Set(habits.monthDateKeys);
  const monthlyTodoGroups = todos.calendarGroups.filter(([dateKey]) => {
    return isDateKey(dateKey) && monthDateKeys.has(dateKey);
  });

  return (
    <ScreenScaffold title={t('calendar.title')}>
      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="accentStrong">
          {t('calendar.habits')}
        </ThemedText>
        <HabitMonthHistory
          monthLabel={habits.monthLabel}
          days={habits.monthHistoryDays}
          onPreviousMonth={habits.goToPreviousMonth}
          onNextMonth={habits.goToNextMonth}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="accentStrong">
          {t('calendar.tasks')}
        </ThemedText>
        {monthlyTodoGroups.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            {t('calendar.noTasks')}
          </ThemedText>
        ) : (
          monthlyTodoGroups.map(([dateKey, groupedTodos]) => (
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

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  group: {
    gap: Spacing.two,
  },
});
