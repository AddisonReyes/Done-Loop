import type { Habit } from '@/features/habits/types';

type TranslationFunction = (key: string, params?: Record<string, string | number>) => string;

export type HabitRecurrenceDetail = {
  label: string;
  value: string;
};

function getHabitCreatedDate(habit: Habit): Date | null {
  const date = new Date(habit.createdAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getIsoWeekday(date: Date): number {
  const weekday = date.getDay();
  return weekday === 0 ? 7 : weekday;
}

function getCreatedDayOfMonth(habit: Habit): number | null {
  const createdDate = getHabitCreatedDate(habit);
  return createdDate ? createdDate.getDate() : null;
}

function getCreatedIsoWeekday(habit: Habit): number | null {
  const createdDate = getHabitCreatedDate(habit);
  return createdDate ? getIsoWeekday(createdDate) : null;
}

function formatNumberList(values: number[]): string {
  const visibleValues = values.slice(0, 6);
  return values.length > visibleValues.length ? `${visibleValues.join(', ')}, ...` : visibleValues.join(', ');
}

function isNumber(value: number | null): value is number {
  return value !== null;
}

export function getHabitRecurrenceDetail(habit: Habit, t: TranslationFunction): HabitRecurrenceDetail | null {
  if (habit.recurrenceType === 'weekly') {
    const weeklyDays = habit.weeklyDays?.length ? habit.weeklyDays : [getCreatedIsoWeekday(habit)].filter(isNumber);

    if (weeklyDays.length === 0) {
      return null;
    }

    return {
      label: t('habits.detail.days'),
      value: weeklyDays.map((day) => t(`habits.weekdayShort.${day}`)).join(', '),
    };
  }

  if (habit.recurrenceType === 'monthly') {
    const monthlyDays = habit.monthlyDays?.length ? habit.monthlyDays : [getCreatedDayOfMonth(habit)].filter(isNumber);

    if (monthlyDays.length === 0) {
      return null;
    }

    return {
      label: t('habits.detail.dates'),
      value: formatNumberList(monthlyDays),
    };
  }

  if (habit.recurrenceType === 'custom' && habit.customIntervalDays) {
    return {
      label: t('habits.detail.interval'),
      value: t('habits.everyDays', { count: habit.customIntervalDays }),
    };
  }

  return null;
}
