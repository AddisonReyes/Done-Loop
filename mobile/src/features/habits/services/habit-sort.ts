import type { Habit } from '@/features/habits/types';

function getRecurrenceDisplayRank(habit: Habit): number {
  if (habit.recurrenceType === 'daily') {
    return 0;
  }

  if (habit.recurrenceType === 'custom') {
    const intervalDays = habit.customIntervalDays ?? Number.POSITIVE_INFINITY;

    if (intervalDays < 7) {
      return 1;
    }

    if (intervalDays < 31) {
      return 3;
    }

    return 5;
  }

  if (habit.recurrenceType === 'weekly') {
    return 2;
  }

  return 4;
}

export function sortHabitsByRecurrenceDisplayOrder(habits: Habit[]): Habit[] {
  return [...habits].sort((first, second) => {
    return getRecurrenceDisplayRank(first) - getRecurrenceDisplayRank(second);
  });
}
