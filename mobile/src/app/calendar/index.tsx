import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { HabitMonthHistory } from '@/features/habits/components/habit-month-history';
import { useHabitsMvp } from '@/features/habits/hooks/use-habits-mvp';
import { TodoListItem } from '@/features/todos/components/todo-list-item';
import { useTodosMvp } from '@/features/todos/hooks/use-todos-mvp';
import { Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { ScreenScaffold } from '@/shared/components/screen-scaffold';

export default function CalendarScreen() {
  const { t } = useTranslation();
  const habits = useHabitsMvp();
  const todos = useTodosMvp();

  return (
    <ScreenScaffold
      eyebrow={t('calendar.eyebrow')}
      title={t('calendar.title')}
      description={t('calendar.description')}>
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
                  editing={false}
                  editingTitle=""
                  dateLabel={todos.getTodoDateLabel(todo)}
                  onEditingTitleChange={() => {}}
                  onComplete={() => void todos.completeTodo(todo)}
                  onReopen={() => void todos.reopenTodo(todo)}
                  onSoftDelete={() => void todos.softDeleteTodo(todo)}
                  onRestore={() => void todos.restoreTodo(todo)}
                  onPermanentDelete={() => void todos.permanentlyDeleteTodo(todo)}
                  onStartEdit={() => {}}
                  onSaveEdit={() => {}}
                  onCancelEdit={() => {}}
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
