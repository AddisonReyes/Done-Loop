import type { Habit } from '@/features/habits/types';
import { dateKeyToUtcDayNumber, isDateKey, toDateKey } from '@/shared/utils/date';

function getHabitStartDateKey(habit: Habit): string | null {
  const createdAt = new Date(habit.createdAt);

  if (Number.isNaN(createdAt.getTime())) {
    return null;
  }

  return toDateKey(createdAt);
}

function getDayOfMonth(dateKey: string): number {
  return Number(dateKey.slice(8, 10));
}

function getIsoWeekday(dateKey: string): number | null {
  if (!isDateKey(dateKey)) {
    return null;
  }

  const [year, month, day] = dateKey.split('-').map(Number);
  const weekday = new Date(year, month - 1, day).getDay();
  return weekday === 0 ? 7 : weekday;
}

function getLastDayOfMonth(dateKey: string): number {
  const [year, month] = dateKey.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

function getDaysSinceStart(habit: Habit, dateKey: string): number | null {
  const startDateKey = getHabitStartDateKey(habit);
  const startDay = startDateKey ? dateKeyToUtcDayNumber(startDateKey) : null;
  const targetDay = dateKeyToUtcDayNumber(dateKey);

  if (startDay === null || targetDay === null || targetDay < startDay) {
    return null;
  }

  return targetDay - startDay;
}

export function isHabitDueOnDate(habit: Habit, dateKey: string): boolean {
  if (!habit.isActive || habit.deletedAt || !isDateKey(dateKey)) {
    return false;
  }

  const daysSinceStart = getDaysSinceStart(habit, dateKey);
  if (daysSinceStart === null) {
    return false;
  }

  if (habit.recurrenceType === 'daily') {
    return true;
  }

  if (habit.recurrenceType === 'weekly') {
    if (habit.weeklyDays && habit.weeklyDays.length > 0) {
      const isoWeekday = getIsoWeekday(dateKey);
      return isoWeekday !== null && habit.weeklyDays.includes(isoWeekday);
    }

    return daysSinceStart % 7 === 0;
  }

  if (habit.recurrenceType === 'custom') {
    return !!habit.customIntervalDays && daysSinceStart % habit.customIntervalDays === 0;
  }

  const startDateKey = getHabitStartDateKey(habit);
  if (!startDateKey) {
    return false;
  }

  const monthlyDays =
    habit.monthlyDays && habit.monthlyDays.length > 0 ? habit.monthlyDays : [getDayOfMonth(startDateKey)];
  const lastDayOfMonth = getLastDayOfMonth(dateKey);
  const dueDaysOfMonth = new Set(monthlyDays.map((day) => Math.min(day, lastDayOfMonth)));
  return dueDaysOfMonth.has(getDayOfMonth(dateKey));
}

export function getHabitsDueOnDate(habits: Habit[], dateKey: string): Habit[] {
  return habits.filter((habit) => isHabitDueOnDate(habit, dateKey));
}
