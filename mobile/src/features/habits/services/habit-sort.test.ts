import type { Habit } from '@/features/habits/types';

import { sortHabitsByRecurrenceDisplayOrder } from './habit-sort';

function createHabit(id: string, overrides: Partial<Habit>): Habit {
  return {
    id,
    name: id,
    recurrenceType: 'daily',
    remindersEnabled: false,
    isActive: true,
    createdAt: '2026-05-01T12:00:00.000Z',
    updatedAt: '2026-05-01T12:00:00.000Z',
    ...overrides,
  };
}

describe('habit sort', () => {
  it('orders habits by recurrence display buckets', () => {
    const habits = [
      createHabit('custom_31', { recurrenceType: 'custom', customIntervalDays: 31 }),
      createHabit('monthly', { recurrenceType: 'monthly' }),
      createHabit('weekly', { recurrenceType: 'weekly' }),
      createHabit('custom_30', { recurrenceType: 'custom', customIntervalDays: 30 }),
      createHabit('custom_6', { recurrenceType: 'custom', customIntervalDays: 6 }),
      createHabit('daily', { recurrenceType: 'daily' }),
      createHabit('custom_7', { recurrenceType: 'custom', customIntervalDays: 7 }),
    ];

    expect(sortHabitsByRecurrenceDisplayOrder(habits).map((habit) => habit.id)).toEqual([
      'daily',
      'custom_6',
      'weekly',
      'custom_30',
      'custom_7',
      'monthly',
      'custom_31',
    ]);
  });

  it('does not mutate the original habit list', () => {
    const habits = [
      createHabit('monthly', { recurrenceType: 'monthly' }),
      createHabit('daily', { recurrenceType: 'daily' }),
    ];

    sortHabitsByRecurrenceDisplayOrder(habits);

    expect(habits.map((habit) => habit.id)).toEqual(['monthly', 'daily']);
  });
});
