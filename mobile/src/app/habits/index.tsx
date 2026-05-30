import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { HabitFilterTabs } from '@/features/habits/components/habit-filter-tabs';
import { HabitForm } from '@/features/habits/components/habit-form';
import { HabitListItem } from '@/features/habits/components/habit-list-item';
import { HabitMonthHistory } from '@/features/habits/components/habit-month-history';
import { useHabitsMvp } from '@/features/habits/hooks/use-habits-mvp';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ScreenScaffold } from '@/shared/components/screen-scaffold';

export default function HabitsScreen() {
  const theme = useTheme();
  const {
    cancelEditingHabit,
    completedHabitIds,
    createHabit,
    deactivateHabit,
    editingHabitId,
    editingHabitName,
    errorMessage,
    filter,
    goToNextMonth,
    goToPreviousMonth,
    isLoading,
    monthHistoryDays,
    monthLabel,
    newHabitName,
    pendingCount,
    saveEditingHabit,
    setEditingHabitName,
    setFilter,
    setNewHabitName,
    startEditingHabit,
    todayKey,
    toggleTodayCompletion,
    totalCompletedToday,
    visibleHabits,
    habits,
  } = useHabitsMvp();

  return (
    <ScreenScaffold
      eyebrow={todayKey}
      title="Hábitos"
      description="Crea hábitos diarios, marca el progreso de hoy y desactiva lo que ya no forma parte de tu rutina.">
      <View style={styles.summary}>
        <View
          style={[
            styles.summaryItem,
            { backgroundColor: theme.accentSoft, borderColor: theme.borderStrong },
          ]}>
          <ThemedText type="subtitle" style={styles.summaryNumber}>
            {totalCompletedToday}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            completados
          </ThemedText>
        </View>
        <View
          style={[
            styles.summaryItem,
            { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
          ]}>
          <ThemedText type="subtitle" style={styles.summaryNumber}>
            {pendingCount}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            pendientes
          </ThemedText>
        </View>
      </View>

      <HabitForm value={newHabitName} onChangeText={setNewHabitName} onSubmit={createHabit} />

      <HabitFilterTabs value={filter} onChange={setFilter} />

      <HabitMonthHistory
        monthLabel={monthLabel}
        days={monthHistoryDays}
        onPreviousMonth={goToPreviousMonth}
        onNextMonth={goToNextMonth}
      />

      {errorMessage ? (
        <ThemedText type="small" themeColor="warning">
          {errorMessage}
        </ThemedText>
      ) : null}

      {isLoading ? (
        <ThemedText type="small" themeColor="textSecondary">
          Cargando hábitos...
        </ThemedText>
      ) : null}

      {!isLoading && habits.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Aún no tienes hábitos activos. Crea el primero para empezar el loop de hoy.
        </ThemedText>
      ) : null}

      {!isLoading && habits.length > 0 && visibleHabits.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No hay hábitos en este filtro.
        </ThemedText>
      ) : null}

      <View style={styles.list}>
        {visibleHabits.map((habit) => (
          <HabitListItem
            key={habit.id}
            habit={habit}
            completedToday={completedHabitIds.has(habit.id)}
            editing={editingHabitId === habit.id}
            editingName={editingHabitName}
            onEditingNameChange={setEditingHabitName}
            onToggleToday={() => {
              void toggleTodayCompletion(habit.id);
            }}
            onStartEdit={() => startEditingHabit(habit)}
            onSaveEdit={() => {
              void saveEditingHabit();
            }}
            onCancelEdit={cancelEditingHabit}
            onDeactivate={() => {
              void deactivateHabit(habit.id);
            }}
          />
        ))}
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  summaryItem: {
    flex: 1,
    minHeight: 92,
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.three,
    gap: Spacing.one,
    justifyContent: 'center',
  },
  summaryNumber: {
    fontSize: 28,
    lineHeight: 34,
  },
  list: {
    gap: Spacing.two,
  },
});
