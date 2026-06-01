import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { HabitMonthHistory } from '@/features/habits/components/habit-month-history';
import { useHabits } from '@/features/habits/hooks/use-habits';
import { TodoListItem } from '@/features/todos/components/todo-list-item';
import { useTodos } from '@/features/todos/hooks/use-todos';
import { Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { ScreenScaffold } from '@/shared/components/screen-scaffold';

export default function CalendarScreen() {
  const { t } = useTranslation();
  const habits = useHabits();
  const todos = useTodos();

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
        {todos.calendarGroups.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            {t('calendar.noTasks')}
          </ThemedText>
        ) : (
          todos.calendarGroups.map(([dateKey, groupedTodos]) => (
            <View key={dateKey} style={styles.group}>
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
